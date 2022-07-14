import { CodeEmitter } from "./code-emitter";
import { CodeGenerator } from "./code-generator";
import { SymbolResolution } from "./symbol-resolution";
import { parse } from "./parser";
import { SymbolTable } from "./symbol-table";
import { IError } from "./error";
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

export interface ICompiler {

    //
    // Errors collected while compiling.
    //
    readonly errors: IError[];

    //
    // Compiles an Aqua script to TEAL.
    //
    compile(input: string): string;
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
    compile(input: string): string {

        const ast = parse(input, this.onCompileError);

        let output: string = "";

        if (this.errors.length === 0) {
            const symbolResolution = new SymbolResolution(this.onCompileError);
            const globalSymbolTable = new SymbolTable(1); // The stack pointer occupies position 0, so global variables are allocated from position 1.
            symbolResolution.resolveSymbols(ast, globalSymbolTable);


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

        return output;
    }
}

//
// Helper function to compile Aqua code to TEAL and write errors to the console.
//
export function compile(code: string, options?: ICompilerOptions): string | undefined {
    const compiler = new Compiler(options);
    const teal = compiler.compile(code);
    if (compiler.errors.length > 0) {
        console.error(`Found ${compiler.errors.length} errors.`);

        for (const error of compiler.errors) {
            console.error(`${error.line}:${error.column}: Error: ${error.message}`);
        }

        return undefined;
    }    

    return teal;
}
