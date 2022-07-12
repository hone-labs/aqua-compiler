import { CodeEmitter } from "./code-emitter";
import { CodeGenerator } from "./code-generator";
import { SymbolResolution } from "./symbol-resolution";
import { parse, parseExpression } from "./parser";
import { OnErrorFn } from "./tokenizer";
import { SymbolTable } from "./symbol-table";
export { IError, OnErrorFn } from "./tokenizer";
export { parse, parseExpression } from "./parser";

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
// Compiles an Aqua script to TEAL.
//
export function compile(input: string, onError?: OnErrorFn, options?: ICompilerOptions): string {
    let errors = 0;
    const ast = parse(input, err => {
        if (onError) {
            onError(err); 
        }
        else {
            console.error(`${err.line}:${err.column}: Error: ${err.msg}`);
        }
        errors += 1;
    });

    if (errors > 0) {
        throw new Error(`Found ${errors} errors.`);
    }

    const symbolResolution = new SymbolResolution();
    const globalSymbolTable = new SymbolTable(1); // The stack pointer occupies position 0, so global variables are allocated from position 1.
    symbolResolution.resolveSymbols(ast, globalSymbolTable);

    const codeEmitter = new CodeEmitter(!!options?.outputComments);
    const codeGenerator = new CodeGenerator(codeEmitter);
    codeGenerator.generateCode(ast);

    let output = "";
    if (!options?.disableVersionStamp) {
        output += `// Aqua v${packageJson.version}\r\n`;
    }

    output += `#pragma version 5\r\n`;
    output += codeEmitter.getOutput().join("\r\n");
    return output;
}

