
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
    else if (node.nodeType === "block-statement") {
        // No need for anything else.
    }
    else if (node.nodeType === "expr-statement") {
        // No need for anything else.
    }
    else if (node.nodeType === "return-statement") {
        output.push(`return`);
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