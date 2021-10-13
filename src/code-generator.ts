import { ASTNode } from "./ast";
import { MAX_SCRATCH } from "./config";

//
// Defines a function that can generate code for a node.
//
type NodeHandler = (node: ASTNode, output: string[]) => void;

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
    private functions: ASTNode[] = [];

    //
    // Tracks if we generating code within a function (or otherwise global code).
    //
    private inFunction: boolean = false;

    //
    // Generates code from an AST representation of an Aqua script.
    //
    generateCode(ast: ASTNode): string[] {

        //
        // To start with we generate global code.
        //
        this.inFunction = false;

        const output: string[] = [];

        //
        // Setup the initial stack pointer to the end of the scratch space.
        //
        output.push(`\t\t\t// Program setup.`)
        output.push(`int ${MAX_SCRATCH}\t\t// Initial stack pointer`);
        output.push(`store 0\t\t// Set stack_pointer`);
        output.push(``);

        this.internalGenerateCode(ast, output);

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
                this.generateFunctionCode(output, functionNode);
            }    

            output.push(``);
            output.push(`program-end:`);
        }


        return output;
    }

    //
    // Generates the code for a function.
    //
    private generateFunctionCode(output: string[], functionNode: ASTNode) {
        output.push(``);
        output.push(`fn-${functionNode.name}:`);

        output.push(`\t\t\t// Function setup.`)

        output.push(`load 0\t\t// Take copy of current stack_pointer on stack so that we can save it as the "previous stack pointer" in the new stack frame.`);

        // 
        // Decrement the stack pointer by the amount of variables used by the function.
        //
        output.push(`\t\t\t// Allocate stack frame for the function being called and update the stack_pointer.`);
        output.push(`\t\t\t// stack_pointer = stack_pointer - (num_locals+1)`)
        output.push(`load 0\t\t// stack_pointer`);
        output.push(`int ${functionNode.scope!.getNumSymbols()+1}\t\t// num_locals+1`); // Amount used by this function + 1 for saved stack_pointer.
        output.push(`-\t\t\t// stack_pointer - (num_locals+1)`); // stack_pointer - (num_locals+1)
        output.push(`store 0\t\t// stack_pointer = stack_pointer - (num_locals+1)`); // stack_pointer = stack_pointer - (num_locals+1)

        //
        // Store previous stack pointer at position one in the new stack frame 
        // (so that the previous stack frame can be restored after this function has returned).
        //
        output.push(`load 0\t\t// Loads the stack_pointer for the new stack frame, this is where we'll store the previous stack pointer.`); // Loads the stack_pointer for the new stack frame, this is where we'll store the previous stack pointer.
        output.push(`swap\t\t// The values on the compute stack are in the wrong order, swap so they are in the right order.`); // The values on the compute stack are in the wrong order, swap so they are in the right order.
        output.push(`stores\t\t// Stores previous stack pointer at the first position in the new stack frame.`); // Stores previous stack pointer at the first position in the new stack frame.
        output.push(``);

        if (functionNode.params) {
            output.push(`\t\t\t// Setup arguments.`);

            for (const param of functionNode.params) {
                const symbol = functionNode.scope!.get(param); 
                output.push(`int ${symbol!.position}`); // Variable position within stack frame.                    
                output.push(`load 0`); // stack_pointer
                output.push(`+`); // stack_pointer + variable_position
                output.push(`stores\t\t// Stores "${param}".`);
            }
        }

        output.push(`\t\t\t// Function body.`)

        //
        // Now we can generate code for the function.
        //
        this.internalGenerateCode(functionNode.body!, output);

        output.push(`\t\t\t// Function cleanup. Restores the previous stack frame.`)

        // 
        // Restore the original stack pointer.
        //
        output.push(`load 0\t\t// stack_pointer`);
        output.push(`loads\t\t// previous_stack_pointer`);
        output.push(`save 0\t\t// stack_pointer = previous_stack_pointer`); // Restore stack_pointer to previous_stack_pointer.

        //
        // Return from the function if not already done so explicitly.
        //
        output.push(`retsub\t\t// Catch all return.`);
    }

    //
    // Generates code from an AST representation of an Aqua script.
    //
    private internalGenerateCode(node: ASTNode, output: string[]): void {

        const pre = this.pre[node.nodeType];
        if (pre) {
            pre(node, output);
        }

        if (node.children) {
            for (const child of node.children) {
                this.internalGenerateCode(child, output);
            }
        }

        const post = this.post[node.nodeType];
        if (post) {
            post(node, output);
        }
        }

    //
    // Code to be invoked for each type of node before generating code for children.
    //
    pre: INodeHandlerMap = {

        "declare-variable": (node, output) => {
            if (node.children && node.children.length > 0) {
                if (!node.symbol!.isGlobal) {                    
                    // 
                    // Prepare a reference to the stack frame location for the variable being assigned.
                    //
                    output.push(`int ${node.symbol!.position}`); // Variable position within stack frame.                    
                    output.push(`load 0`); // stack_pointer
                    output.push(`+`); // stack_pointer + variable_position.
                }                
            }
        },

        "assignment-statement": (node, output) => {

            if (!node.symbol!.isGlobal) {
                // 
                // Prepare a reference to the stack frame location for the variable being assigned.
                //
                output.push(`int ${node.symbol!.position}`); // Variable position within stack frame.                    
                output.push(`load 0`); // stack_pointer
                output.push(`+`); // stack_pointer + variable_position
    }
        },
    };

    //
    // Code to be invoked for each type of node after generating code for children.
    //
    post: INodeHandlerMap = {
        "operator": (node, output) => output.push(node.opcode!),
        "literal": (node, output) => output.push(`${node.opcode} ${node.value}`),
        "txn": (node, output) => output.push(`txn ${node.name}`),
        "gtxn": (node, output) => output.push(`gtxn ${node.value} ${node.name}`),
        "arg": (node, output) => output.push(`arg ${node.value}`),
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

        // Sets variable from initialiser.
        "declare-variable": (node, output) => {
            if (node.children && node.children.length > 0) {
                if (node.symbol!.isGlobal) {                    
                    output.push(`store ${node.symbol!.position}`);
                }
                else {
                    output.push(`stores`);
                }                
            }
        },

        // Get variable from scratch.
        "access-variable": (node, output) => {
            if (node.symbol!.isGlobal) {                    
                output.push(`load ${node.symbol!.position}`);
            }
            else {
                output.push(`load 0`); // stack_pointer
                output.push(`int ${node.symbol!.position}`); // Variable position within stack frame.                    
                output.push(`+`); // stack_pointer + variable_position
                output.push(`loads`); // Loads variable onto stack.
            }
        },

        "if-statement": (node, output) => {
            
            this.ifStatementId += 1;

            output.push(`bz else-${this.ifStatementId}`);

            this.internalGenerateCode(node.ifBlock!, output);

            output.push(`b end-${this.ifStatementId}`);

            output.push(`else-${this.ifStatementId}:`);

            if (node.elseBlock) {
                this.internalGenerateCode(node.elseBlock, output);
            }

            output.push(`end-${this.ifStatementId}:`);
        },

        // Store variable to scratch.
        "assignment-statement": (node, output) => {

            if (node.symbol!.isGlobal) {
            output.push(`store ${node.symbol!.position}`);
            }
            else {
                output.push(`stores`);
            }
        },

        "function-call": (node, output) => {
            output.push(`callsub fn-${node.name}`);
        },

        "function-declaration": (node, output) => {
            this.functions.push(node); // Collect functions so their code can be generated in a second pass.
        },
    };

}

