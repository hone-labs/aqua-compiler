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

//
// Handles TEAL code generation for the Aqua compiler.
//
export class CodeGenerator {

    //
    // Used to generate unique IDs for if statements.
    //
    private ifStatementId = 0;

    //
    // Position for the next scratch variable.
    //
    private nextVariablePosition = 0;

    //
    // Generates code from an AST representation of an Aqua script.
    //
    generateCode(node: any): string[] {
        const output: string[] = [];
        const variables = new Map<string, number>();
        this.internalGenerateCode(node, output, variables);
        return output;
    }

    //
    // Generates code from an AST representation of an Aqua script.
    //
    private internalGenerateCode(node: any, output: string[], variables: Map<string, number>): void {

        if (node.children) {
            for (const child of node.children) {
                this.internalGenerateCode(child, output, variables);
            }
        }

        const nodeHandler = this.nodeHandlers[node.nodeType];
        if (nodeHandler === undefined) {
            throw new Error(`Unexpected node type ${node.nodeType}`);
        }

        this.nodeHandlers[node.nodeType](node, output, variables);
    }

    //
    // Lookup table for funtions that handle code generation for each node.
    //
    nodeHandlers: INodeHandlerMap = {
        operator: (node, output, variables) => output.push(node.opcode),
        literal: (node, output, variables) => output.push(`${node.opcode} ${node.value}`),
        txn: (node, output, variables) => output.push(`txn ${node.fieldName}`),
        arg: (node, output, variables) => output.push(`arg ${node.argIndex}`),
        "block-statement": (node, output, variables) => {},
        "expr-statement": (node, output, variables) => {},
        "return-statement": (node, output, variables) => output.push(`return`),
        "declare-variable": (node, output, variables) => {
            if (variables.has(node.name)) {
                throw new Error(`Variable ${node.name} is already declared!`);
            }

            //
            // Allocate a position for the variable in scratch.
            //
            const position = this.nextVariablePosition++;

            variables.set(node.name, position);

            if (node.children && node.children.length > 0) {
                // Set variable from initialiser.
                output.push(`store ${position}`);
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
            
            this.ifStatementId += 1;

            output.push(`bz else-${this.ifStatementId}`);

            this.internalGenerateCode(node.ifBlock, output, variables);

            output.push(`b end-${this.ifStatementId}`);

            output.push(`else-${this.ifStatementId}:`);

            if (node.elseBlock) {
                this.internalGenerateCode(node.elseBlock, output, variables);
            }

            output.push(`end-${this.ifStatementId}:`);
        },
        "assignment-statement": (node, output, variables) => {

            if (node.assignee.nodeType !== "access-variable") {
                throw new Error(`Expected assignee to be an lvalue.`);
            }

            const position = variables.get(node.assignee.name);
            if (position === undefined) {
                throw new Error(`Variable ${node.assignee.name} is not declared!`);
            }

            // Store variable to scratch.
            output.push(`store ${position}`);
        },
    };

}

