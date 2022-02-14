import { CodeEmitter } from "./code-emitter";
import { CodeGenerator } from "./code-generator";
import { SymbolResolution } from "./symbol-resolution";
import { parse, parseExpression } from "./parser";

const packageJson = require("../package.json");

//
// Options to control the compiler.
//
export interface ICompilerOptions {
    disableVersionStamp?: boolean;
}

//
// Compiles an Aqua script to TEAL.
//
export function compile(input: string, options?: ICompilerOptions): string {
    let errors = 0;
    const ast = parse(input, err => {
        console.error(`${err.line}:${err.column}: Error: ${err.msg}`);
        errors += 1;
    });

    if (errors > 0) {
        throw new Error(`Found ${errors} errors.`);
    }

    const symbolResolution = new SymbolResolution();
    symbolResolution.resolveSymbols(ast);

    const codeEmitter = new CodeEmitter(false);
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

//
// Compiles an expression to TEAL.
//
export function compileExpression(input: string): string {
    let errors = 0;
    const ast = parseExpression(input, err => {
        console.error(`${err.line}:${err.column}: Error: ${err.msg}`);
        errors += 1;
    });

    if (errors > 0) {
        throw new Error(`Found ${errors} errors.`);
    }

    const symbolResolution = new SymbolResolution();
    symbolResolution.resolveSymbols(ast);

    const codeEmitter = new CodeEmitter(false);
    const codeGenerator = new CodeGenerator(codeEmitter);
    codeGenerator.generateCode(ast);
    return codeEmitter.getOutput().join("\r\n");
}

