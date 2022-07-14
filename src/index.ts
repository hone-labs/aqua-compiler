import { CodeEmitter } from "./code-emitter";
import { CodeGenerator } from "./code-generator";
import { SymbolResolution } from "./symbol-resolution";
import { parse } from "./parser";
import { ISymbolTable, SymbolTable } from "./symbol-table";
import { IError } from "./error";
import { ASTNode } from "./ast";
export { parse, parseExpression } from "./parser";
export { IError, OnErrorFn } from "./error";

const packageJson = require("../package.json");

//
// Options to control the compiler.
//
export interface ICompilerOptions {
    //
    // Disables output of the TEAL version pragma.
    //
    disableVersionStamp?: boolean;

    //
    // Enables comments in the generated TEAL code.
    //
    outputComments?: boolean;
}

//
// The result of compiling a program.
//
export interface ICompilerResult {

    //
    // Code that was generated.
    //
    output: string;

    //
    // The abstract syntax tree that was parsed from input code.
    //
    ast: ASTNode;

    //
    // The symbol table for the program.
    //
    symbolTable: ISymbolTable;
}

export interface ICompiler {

    //
    // Errors collected while compiling.
    //
    readonly errors: IError[];

    //
    // Compiles an Aqua script to TEAL.
    //
    compile(input: string): ICompilerResult;
}

export class Compiler implements ICompiler {

    //
    // Errors collected while compiling.
    //
    readonly errors: IError[] = [];

    constructor(private options?: ICompilerOptions) {
        this.onCompileError = this.onCompileError.bind(this);
    }

    //
    // Event raised when a compiler error occurs.
    //
    private onCompileError(err: IError) {
        this.errors.push(err);
    }

    //
    // Compiles an Aqua script to TEAL.
    //
    compile(input: string): ICompilerResult {

        const ast = parse(input, this.onCompileError);

        let output: string = "";

        const symbolTable = new SymbolTable(1); // The stack pointer occupies position 0, so global variables are allocated from position 1.

        if (this.errors.length === 0) {
            const symbolResolution = new SymbolResolution(this.onCompileError);
            symbolResolution.resolveSymbols(ast, symbolTable);


            if (this.errors.length === 0) {    
                const codeEmitter = new CodeEmitter(!!this.options?.outputComments);
                const codeGenerator = new CodeGenerator(codeEmitter, this.onCompileError);
                codeGenerator.generateCode(ast);

                if (this.errors.length === 0) {
                    output = "";
                    if (!this.options?.disableVersionStamp) {
                        output += `// Aqua v${packageJson.version}\r\n`;
                    }
                
                    output += `#pragma version 5\r\n`;
                    output += codeEmitter.getOutput().join("\r\n");
                }
            }
        }

        return {
            output,
            ast,
            symbolTable,
        };
    }
}

//
// Helper function to compile Aqua code to TEAL and write errors to the console.
//
export function compile(code: string, options?: ICompilerOptions): string | undefined {
    const compiler = new Compiler(options);
    const result = compiler.compile(code);
    if (compiler.errors.length > 0) {
        console.error(`Found ${compiler.errors.length} errors.`);

        for (const error of compiler.errors) {
            console.error(`${error.line}:${error.column}: Error: ${error.message}`);
        }

        return undefined;
    }    

    return result.output;
}
