import { CodeGenerator } from "./code-generator";

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
    const codeGenerator = new CodeGenerator();
    const output = codeGenerator.generateCode(ast);
    return `#pragma version 3\r\n` + output.join("\r\n");
}

//
// Compiles an expression to TEAL.
//
export function compileExpression(input: string): string {
    const ast = parser.parse(input, { startRule: "expression" });
    const codeGenerator = new CodeGenerator();
    const output = codeGenerator.generateCode(ast);
    return output.join("\r\n");
}

