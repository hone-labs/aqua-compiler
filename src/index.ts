import { CodeEmitter } from "./code-emitter";
import { CodeGenerator } from "./code-generator";
import { SymbolResolution } from "./symbol-resolution";

const parser = require("./parser");

//
// Parses Aqua code to an AST.
//
export function parse(input: string): any {
    return parser.parse(input);
}

//
// Compiles an Aqua script to TEAL.
//
export function compile(input: string): string {
    const ast = parse(input);

    const symbolResolution = new SymbolResolution();
    symbolResolution.resolveSymbols(ast);

    const codeEmitter = new CodeEmitter(true);
    const codeGenerator = new CodeGenerator(codeEmitter);
    const output = codeGenerator.generateCode(ast);
    return `#pragma version 4\r\n` + codeEmitter.getOutput().join("\r\n");
}

//
// Compiles an expression to TEAL.
//
export function compileExpression(input: string): string {
    const ast = parser.parse(input, { startRule: "expression" });

    const symbolResolution = new SymbolResolution();
    symbolResolution.resolveSymbols(ast);

    const codeEmitter = new CodeEmitter(true);
    const codeGenerator = new CodeGenerator(codeEmitter);
    const output = codeGenerator.generateCode(ast);
    return codeEmitter.getOutput().join("\r\n");
}

