//
// Defines a function that can generate code for a node.
//
type NodeHandler = (node: any, output: string[]) => void;

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
    // A list of functions to be output at the end.
    //
    private functions: any[] = [];

    //
    // Tracks if we generating code within a function (or otherwise global code).
    //
    private inFunction: boolean = false;

    //
    // Generates code from an AST representation of an Aqua script.
    //
    generateCode(node: any): string[] {

        //
        // To start with we generate global code.
        //
        this.inFunction = false;

        const output: string[] = [];
        this.internalGenerateCode(node, output);

        if (this.functions.length > 0) {
            //
            // Ensures the code for functions is never executed unless we specifically call the function.
            //
            output.push(`b program-end`); 

            //
            // Now generating code within functions.
            //
            this.inFunction = true;

            for (const functionNode of this.functions) {
                //
                // Generate code for functions at the end.
                //            
                output.push(`fn-${functionNode.name}:`);
        
                this.internalGenerateCode(functionNode.body, output);

                output.push(`retsub`);
            }    

            output.push(`program-end:`);
        }


        return output;
    }

    //
    // Generates code from an AST representation of an Aqua script.
    //
    private internalGenerateCode(node: any, output: string[]): void {

        if (node.children) {
            for (const child of node.children) {
                this.internalGenerateCode(child, output);
            }
        }

        const nodeHandler = this.nodeHandlers[node.nodeType];
        if (nodeHandler === undefined) {
            throw new Error(`Unexpected node type ${node.nodeType}`);
        }

        this.nodeHandlers[node.nodeType](node, output);
    }

    //
    // Lookup table for funtions that handle code generation for each node.
    //
    nodeHandlers: INodeHandlerMap = {
        operator: (node, output) => output.push(node.opcode),
        literal: (node, output) => output.push(`${node.opcode} ${node.value}`),
        txn: (node, output) => output.push(`txn ${node.fieldName}`),
        gtxn: (node, output) => output.push(`gtxn ${node.transactionIndex} ${node.fieldName}`),
        arg: (node, output) => output.push(`arg ${node.argIndex}`),
        "block-statement": (node, output) => {},
        "expr-statement": (node, output) => {},
        "return-statement": (node, output) => {
            if (this.inFunction) {
                //
                // Code in a function executes the "retsub" opcode to return from the function.
                //
                output.push(`retsub`);
            }
            else {
                //
                // Global code executes the "return" opcode to finish the entire program.
                //
                output.push(`return`);
            }
        },
        "declare-variable": (node, output) => {
            if (node.children && node.children.length > 0) {
                // Set variable from initialiser.
                output.push(`store ${node.symbol.position}`);
            }
        },
        "declare-constant": (node, output) => {
            if (node.children && node.children.length > 0) {
                output.push(`store ${node.symbol.position}`);
            }
        },
        "access-variable": (node, output) => {
            // Get variable from scratch.
            output.push(`load ${node.symbol.position}`);
        },
        "if-statement": (node, output) => {
            
            this.ifStatementId += 1;

            output.push(`bz else-${this.ifStatementId}`);

            this.internalGenerateCode(node.ifBlock, output);

            output.push(`b end-${this.ifStatementId}`);

            output.push(`else-${this.ifStatementId}:`);

            if (node.elseBlock) {
                this.internalGenerateCode(node.elseBlock, output);
            }

            output.push(`end-${this.ifStatementId}:`);
        },
        "assignment-statement": (node, output) => {
            // Store variable to scratch.
            output.push(`store ${node.symbol.position}`);
        },
        "function-call": (node, output) => {
            output.push(`callsub fn-${node.name}`);
        },
        "function-declaration": (node, output) => {
            this.functions.push(node); // Collect functions so their code can be generated in a second pass.
        },
    };

}

