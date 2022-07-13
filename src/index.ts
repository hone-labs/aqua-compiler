import { CodeEmitter } from "./code-emitter";
import { CodeGenerator } from "./code-generator";
import { SymbolResolution } from "./symbol-resolution";
import { parse } from "./parser";
import { SymbolTable } from "./symbol-table";
import { IError, OnErrorFn } from "./error";
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

    let numErrors = 0;

    function onCompileError(err: IError) {
        numErrors += 1;
        if (onError) {
            onError(err); 
        }
        else {
            console.error(`${err.line}:${err.column}: Error: ${err.message}`);
        }
    }

    const ast = parse(input, onCompileError);

    let output: string = "";

    if (numErrors === 0) {
        const symbolResolution = new SymbolResolution(onCompileError);
        const globalSymbolTable = new SymbolTable(1); // The stack pointer occupies position 0, so global variables are allocated from position 1.
        symbolResolution.resolveSymbols(ast, globalSymbolTable);


        if (numErrors === 0) {    
            const codeEmitter = new CodeEmitter(!!options?.outputComments);
            const codeGenerator = new CodeGenerator(codeEmitter, onCompileError);
            codeGenerator.generateCode(ast);

            if (numErrors === 0) {
                output = "";
                if (!options?.disableVersionStamp) {
                    output += `// Aqua v${packageJson.version}\r\n`;
                }
            
                output += `#pragma version 5\r\n`;
                output += codeEmitter.getOutput().join("\r\n");
            }
        }
    }

    if (!onError && numErrors > 0) {
        console.error(`Found ${numErrors} errors.`);
    }

    return output;
}

