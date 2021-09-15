const parser = require("./parser");

//
// Compiles an Aqua script to TEAL.
//
export function compile(input: string): string {
    const ast = parser.parse(input);

    const output: string[] = [];
    genCode(ast, output);

    return output.join("\r\n");
}

//
// Generates code from an AST representation of an Aqua script.
//
export function genCode(node: any, output: string[]): void {

    if (node.children) {
        for (const child of node.children) {
            genCode(child, output);
        }
    }

    if (node.nodeType === "operator") {
        output.push(node.opcode);
    }
    else if (node.nodeType === "literal") {
        output.push(`${node.opcode} ${node.value}`);
    }
    else {
        throw new Error(`Unexpected node type ${node.nodeType}`);
    }
}