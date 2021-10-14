import { ASTNode } from "./ast";
import { ICodeEmitter } from "./code-emitter";
import { MAX_SCRATCH } from "./config";

//
// Defines a function that can generate code for a node.
//
type NodeHandler = (node: ASTNode) => void;

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

    constructor(private codeEmitter: ICodeEmitter) {
    }

    //
    // Generates code from an AST representation of an Aqua script.
    //
    generateCode(ast: ASTNode): void {

        //
        // To start with we generate global code.
        //
        this.inFunction = false;

        //
        // Collect functions so their code can be generated in a second pass.
        //
        this.functions = [];
        this.collectFunctions(ast);

        //
        // Setup the initial stack pointer to the end of the scratch space.
        //
        if (this.functions.length > 0) {
            this.codeEmitter.startBlock("setup");
            this.codeEmitter.add(``, `Function data stack setup.`);
            this.codeEmitter.add(`int ${MAX_SCRATCH}`, `Initial stack pointer.`);
            this.codeEmitter.add(`store 0`, `Set stack_pointer`);
            this.codeEmitter.add(``);
            this.codeEmitter.endBlock();
        }

        //
        // Generate code for non functions.
        //
        this.internalGenerateCode(ast);

        if (this.functions.length > 0) {
            //
            // Ensures the code for functions is never executed unless we specifically call the function.
            //
            this.codeEmitter.startBlock("setup");
            this.codeEmitter.add(`b program_end`); 
            this.codeEmitter.endBlock();

            //
            // Now generating code within functions.
            //
            this.inFunction = true;

            for (const functionNode of this.functions) {
                //
                // Generate code for functions at the end.
                //            
                this.generateFunctionCode(functionNode);
            }    

            this.codeEmitter.startBlock("setup");
            this.codeEmitter.add(``);
            this.codeEmitter.add(`program_end:`);
            this.codeEmitter.endBlock();
        }
    }

    //
    // Generates the code for a function.
    //
    private generateFunctionCode(functionNode: ASTNode) {

        this.codeEmitter.add(`${functionNode.name}:`);

        this.codeEmitter.startBlock("setup");
        this.codeEmitter.add(``, `Function setup.`)

        this.codeEmitter.add(`load 0`, `Take copy of current stack_pointer on stack so that we can save it as the "previous stack pointer" in the new stack frame.`);

        // 
        // Decrement the stack pointer by the amount of variables used by the function.
        //
        this.codeEmitter.add(``, `Allocate stack frame for the function being called and update the stack_pointer.`);
        this.codeEmitter.add(``, `stack_pointer = stack_pointer - (num_locals+1)`)
        this.codeEmitter.add(`load 0`, `stack_pointer`);
        this.codeEmitter.add(`int ${functionNode.scope!.getNumSymbols()+1}`, `num_locals+1`); // Amount used by this function + 1 for saved stack_pointer.
        this.codeEmitter.add(`-`, `stack_pointer - (num_locals+1)`); // stack_pointer - (num_locals+1)
        this.codeEmitter.add(`store 0`, `stack_pointer = stack_pointer - (num_locals+1)`); // stack_pointer = stack_pointer - (num_locals+1)

        //
        // Store previous stack pointer at position one in the new stack frame 
        // (so that the previous stack frame can be restored after this function has returned).
        //
        this.codeEmitter.add(`load 0`, `Loads the stack_pointer for the new stack frame, this is where we'll store the previous stack pointer.`); // Loads the stack_pointer for the new stack frame, this is where we'll store the previous stack pointer.
        this.codeEmitter.add(`swap`, `The values on the compute stack are in the wrong order, swap so they are in the right order.`); // The values on the compute stack are in the wrong order, swap so they are in the right order.
        this.codeEmitter.add(`stores`, `Stores previous stack pointer at the first position in the new stack frame.`); // Stores previous stack pointer at the first position in the new stack frame.
        this.codeEmitter.add(``);

        if (functionNode.params) {
            this.codeEmitter.add(``, `Setup arguments.`);

            for (const param of functionNode.params) {
                const symbol = functionNode.scope!.get(param); 
                this.codeEmitter.add(`int ${symbol!.position}`); // Variable position within stack frame.                    
                this.codeEmitter.add(`load 0`); // stack_pointer
                this.codeEmitter.add(`+`); // stack_pointer + variable_position
                this.codeEmitter.add(`stores`, `Stores "${param}".`);
            }
        }

        this.codeEmitter.add(``, `Function body.`)
        this.codeEmitter.endBlock();

        //
        // Now we can generate code for the function.
        //
        this.internalGenerateCode(functionNode.body!);

        this.codeEmitter.startBlock("setup");
        this.codeEmitter.add(``, `Function cleanup. Restores the previous stack frame.`)

        // 
        // Restore the original stack pointer.
        //
        this.codeEmitter.add(`load 0`, `stack_pointer`);
        this.codeEmitter.add(`loads`, `previous_stack_pointer`);
        this.codeEmitter.add(`save 0`, `stack_pointer = previous_stack_pointer`); // Restore stack_pointer to previous_stack_pointer.

        //
        // Return from the function if not already done so explicitly.
        //
        this.codeEmitter.add(`retsub`, `Catch all return.`);
        this.codeEmitter.endBlock();
    }

    //
    // Generates code from an AST representation of an Aqua script.
    //
    private internalGenerateCode(node: ASTNode): void {

        const pre = this.pre[node.nodeType];
        if (pre) {
            pre(node);
        }

        if (node.children) {
            for (const child of node.children) {
                this.internalGenerateCode(child);
            }
        }

        const post = this.post[node.nodeType];
        if (post) {
            post(node);
        }
    }

    //
    // Code to be invoked for each type of node before generating code for children.
    //
    pre: INodeHandlerMap = {

        "declare-variable": (node) => {
            if (node.children && node.children.length > 0) {
                if (!node.symbol!.isGlobal) {                    
                    // 
                    // Prepare a reference to the stack frame location for the variable being assigned.
                    //
                    this.codeEmitter.add(`int ${node.symbol!.position}`); // Variable position within stack frame.                    
                    this.codeEmitter.add(`load 0`); // stack_pointer
                    this.codeEmitter.add(`+`); // stack_pointer + variable_position.
                }                
            }
        },

        "assignment-statement": (node) => {

            if (!node.symbol!.isGlobal) {
                // 
                // Prepare a reference to the stack frame location for the variable being assigned.
                //
                this.codeEmitter.add(`int ${node.symbol!.position}`); // Variable position within stack frame.                    
                this.codeEmitter.add(`load 0`); // stack_pointer
                this.codeEmitter.add(`+`); // stack_pointer + variable_position
            }
        },
    };

    //
    // Code to be invoked for each type of node after generating code for children.
    //
    post: INodeHandlerMap = {
        "operator": (node) => this.codeEmitter.add(node.opcode!),
        "literal": (node) => this.codeEmitter.add(`${node.opcode} ${node.value}`),
        "txn": (node) => this.codeEmitter.add(`txn ${node.name}`),
        "gtxn": (node) => this.codeEmitter.add(`gtxn ${node.value} ${node.name}`),
        "arg": (node) => this.codeEmitter.add(`arg ${node.value}`),
        "return-statement": (node) => {
            if (this.inFunction) {
                //
                // Code in a function executes the "retsub" opcode to return from the function.
                //
                this.codeEmitter.add(`retsub`);
            }
            else {
                //
                // Global code executes the "return" opcode to finish the entire program.
                //
                this.codeEmitter.add(`return`);
            }
        },

        // Sets variable from initialiser.
        "declare-variable": (node) => {
            if (node.children && node.children.length > 0) {
                if (node.symbol!.isGlobal) {                    
                    this.codeEmitter.add(`store ${node.symbol!.position}`);
                }
                else {
                    this.codeEmitter.add(`stores`);
                }                
            }
        },

        // Get variable from scratch.
        "access-variable": (node) => {
            if (node.symbol!.isGlobal) {                    
                this.codeEmitter.add(`load ${node.symbol!.position}`);
            }
            else {
                this.codeEmitter.add(`load 0`); // stack_pointer
                this.codeEmitter.add(`int ${node.symbol!.position}`); // Variable position within stack frame.                    
                this.codeEmitter.add(`+`); // stack_pointer + variable_position
                this.codeEmitter.add(`loads`); // Loads variable onto stack.
            }
        },

        "if-statement": (node) => {
            
            this.ifStatementId += 1;

            this.codeEmitter.add(`bz else_${this.ifStatementId}`);

            this.internalGenerateCode(node.ifBlock!);

            this.codeEmitter.add(`b end_${this.ifStatementId}`);

            this.codeEmitter.add(`else_${this.ifStatementId}:`);

            if (node.elseBlock) {
                this.internalGenerateCode(node.elseBlock);
            }

            this.codeEmitter.add(`end_${this.ifStatementId}:`);
        },

        // Store variable to scratch.
        "assignment-statement": (node) => {

            if (node.symbol!.isGlobal) {
                this.codeEmitter.add(`store ${node.symbol!.position}`);
            }
            else {
                this.codeEmitter.add(`stores`);
            }
        },

        "function-call": (node) => {
            this.codeEmitter.add(`callsub ${node.name}`);
        },
    };

    //
    // Walk the tree and collection functions so there code can be generated in a second pass.
    //
    private collectFunctions(node: ASTNode): void {

        if (node.children) {
            for (const child of node.children) {
                this.collectFunctions(child);
            }
        }

        if (node.nodeType === "function-declaration") {
            this.functions.push(node);
        }
    }

}

