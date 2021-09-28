//
// Defines a function that can generate code for a node.
//
type NodeHandler = (node: any, output: string[], variables: Map<string, number>) => void;

//
// Lookup table for funtions that handle code generation for each node.
//
interface INodeHandlerMap {
    [index: string]: NodeHandler;
}

//TODO: Having this state should now really encapsulate this code in a class.
let ifStatementId = 0;

//
// Lookup table for funtions that handle code generation for each node.
//
const nodeHandlers: INodeHandlerMap = {
    operator: (node, output, variables) => output.push(node.opcode),
    literal: (node, output, variables) => output.push(`${node.opcode} ${node.value}`),
    txn: (node, output, variables) => output.push(`txn ${node.fieldName}`),
    arg: (node, output, variables) => output.push(`arg ${node.argIndex}`),
    "block-statement": (node, output, variables) => {},
    "expr-statement": (node, output, variables) => {},
    "return-statement": (node, output, variables) => output.push(`return`),
    "print-statement": (node, output, variables) => output.push(`print`),
    "declare-variable": (node, output, variables) => {
        if (variables.has(node.name)) {
            throw new Error(`Variable ${node.name} is already declared!`);
        }

        variables.set(node.name, node.position);

        if (node.children && node.children.length > 0) {
            // Set variable from initialiser.
            output.push(`store ${node.position}`);
        }
    },
    "access-variable": (node, output, variables) => {
        const position = variables.get(node.name);
        if (position === undefined) {
            throw new Error(`Variable ${node.name} is not declared!`);
        }

        // Get variable from scratch.
        output.push(`load ${position}`);
    },
    "if-statement": (node, output, variables) => {
        
        ifStatementId += 1;

        output.push(`bz else-${ifStatementId}`);

        genCode(node.ifBlock, output, variables);

        output.push(`b end-${ifStatementId}`);

        output.push(`else-${ifStatementId}:`);

        if (node.elseBlock) {
            genCode(node.elseBlock, output, variables);
        }

        output.push(`end-${ifStatementId}:`);
    },
};




//
// Generates code from an AST representation of an Aqua script.
//
export function genCode(node: any, output: string[], variables: Map<string, number>): void {

    if (node.children) {
        for (const child of node.children) {
            genCode(child, output, variables);
        }
    }

    const nodeHandler = nodeHandlers[node.nodeType];
    if (nodeHandler === undefined) {
        throw new Error(`Unexpected node type ${node.nodeType}`);
    }

    nodeHandlers[node.nodeType](node, output, variables);
}