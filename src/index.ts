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

//
// Generates code from an AST representation of an Aqua script.
//
export function genCode(node: any, output: string[], variables: Map<string, number>): void {

    if (node.children) {
        for (const child of node.children) {
            genCode(child, output, variables);
        }
    }

    if (node.nodeType === "operator") {
        output.push(node.opcode);
    }
    else if (node.nodeType === "literal") {
        output.push(`${node.opcode} ${node.value}`);
    }
    else if (node.nodeType === "txn") {
        output.push(`txn ${node.fieldName}`);
    }
    else if (node.nodeType === "arg") {
        output.push(`arg ${node.argIndex}`);
    }
    else if (node.nodeType === "block") {
        // No need for anything else.
    }
    else if (node.nodeType === "statement") {
        if (node.stmtType === "expr") {
            // No need for anything else.
        }
        else if (node.stmtType === "return") {
            output.push(`return`);
        }
        else {
            throw new Error(`Unexpected statement type ${node.stmtType}`);
        }
    }
    else if (node.nodeType === "declare-variable") {
        if (variables.has(node.name)) {
            throw new Error(`Variable ${node.name} is already declared!`);
        }

        variables.set(node.name, node.position);

        if (node.children && node.children.length > 0) {
            // Set variable from initialiser.
            output.push(`store ${node.position}`);
        }
    }
    else if (node.nodeType === "access-variable") {
        const position = variables.get(node.name);
        if (position === undefined) {
            throw new Error(`Variable ${node.name} is not declared!`);
        }

        // Get variable from scratch.
        output.push(`load ${position}`);
    }
    else {
        throw new Error(`Unexpected node type ${node.nodeType}`);
    }
}