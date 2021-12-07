import { CodeEmitter } from "./code-emitter";
import { CodeGenerator } from "./code-generator";
import { SymbolResolution } from "./symbol-resolution";

const packageJson = require("../package.json");
const parser = require("./parser");

//
// Parses Aqua code to an AST.
//
export function parse(input: string): any {
    return parser.parse(input);
}

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
    const ast = parse(input);

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
    const ast = parser.parse(input, { startRule: "expression" });

    const symbolResolution = new SymbolResolution();
    symbolResolution.resolveSymbols(ast);

    const codeEmitter = new CodeEmitter(false);
    const codeGenerator = new CodeGenerator(codeEmitter);
    codeGenerator.generateCode(ast);
    return codeEmitter.getOutput().join("\r\n");
}

