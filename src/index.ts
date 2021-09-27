import { genCode } from "./gen-code";

const parser = require("./parser");

//
// Compiles an Aqua script to TEAL.
//
export function compile(input: string): string {
    const ast = parser.parse(input);

    const output: string[] = [];
    const variables = new Map<string, number>();
    genCode(ast, output, variables);

    return `#pragma version 3\r\n` + output.join("\r\n");
}

//
// Compiles an expression to TEAL.
//
export function compileExpression(input: string): string {
    const ast = parser.parse(input, { startRule: "expression" });

    const output: string[] = [];
    const variables = new Map<string, number>();
    genCode(ast, output, variables);

    return output.join("\r\n");
}

