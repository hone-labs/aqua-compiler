import { ASTNode } from "./ast";
import { ICodeEmitter } from "./code-emitter";
import { MAX_SCRATCH } from "./config";

//
// Defines a function that can visit nodes in the AST to generate code.
//
type NodeVisitorFn = (node: ASTNode) => void;

//
// Defines pre- and post- functions for visiting nodes of the AST.
//
interface INodeVisitor {
    //
    // Called before children of the node are visited.
    //
    pre?: NodeVisitorFn,

    //
    // Called after children of the node are visited.
    //
    post?: NodeVisitorFn,
}

//
// Lookup table for AST node visitor functions.
//
interface INodeVisitorMap {
    [index: string]: INodeVisitor;
}

//
// Handles TEAL code generation for the Aqua compiler.
//
export class CodeGenerator {

    //
    // Used to generate unique IDs for control statements.
    //
    private controlStatementId = 0;

    //
    // A list of functions to be output at the end.
    //
    private functions: ASTNode[] = [];

    //
    // Tracks if we generating code within a function (or otherwise global code).
    //
    private inFunction: boolean = false;

    //
    // Tracks the function for which we are generating code.
    //
    private curFunction?: ASTNode = undefined;

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
        this.curFunction = undefined;

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

        // 
        // Tracks the function we currently generating code for.
        //
        this.curFunction = functionNode;

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

            for (const param of functionNode.params.reverse()) { // Parameters are popped from the stack in reverse order to what they are pushed.
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

        // 
        // Restore the original stack pointer.
        //
        this.codeEmitter.startBlock("setup");
        this.codeEmitter.add(`${functionNode.name}-cleanup:`, `Function cleanup. Restores the previous stack frame`);
        this.codeEmitter.add(`load 0`, `Loads current stack_pointer`)
        this.codeEmitter.add(`loads`, `Loads previous_stack_pointer`);
        this.codeEmitter.add(`store 0`, `stack_pointer = previous_stack_pointer`); // Restore stack_pointer to previous_stack_pointer.

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

        const visitor = this.visitors[node.nodeType]
        if (visitor && visitor.pre) {
            visitor.pre(node);
        }

        if (node.children) {
            for (const child of node.children) {
                this.internalGenerateCode(child);
            }
        }

        if (visitor && visitor.post) {
            visitor.post(node);
        }
    }

    //
    // Code to be invoked to visit each node in the AST.
    //
    visitors: INodeVisitorMap = {

        "operation": {
            post: (node) => {
                let output = node.opcode!;
                if (node.args) {
                    output += ` ${node.args.join(" ")}`;
                }
                this.codeEmitter.add(output);
            },
        },

        "expr-statement": {
            post: (node) => {
                if (node.children) {
                    // Assume each child has pushed a value on the stack that must be undone.
                    for (const child of node.children) {
                        this.codeEmitter.add(`pop`, `Clean the stack after expression statements.`);
                    }
                }
            },
        },

        "return-statement": {
            post: (node) => {
                if (this.inFunction) {
                    //
                    // End of function! Jump to function cleanup code.
                    //
                    this.codeEmitter.add(`b ${this.curFunction!.name}-cleanup`);
                }
                else {
                    //
                    // Global code executes the "return" opcode to finish the entire program.
                    //
                    this.codeEmitter.add(`return`);
                }
            },
        },
        
        "declare-variable": {
            pre: (node) => {
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

            post: (node) => {
                if (node.children && node.children.length > 0) {
                    if (node.symbol!.isGlobal) {                    
                        this.codeEmitter.add(`store ${node.symbol!.position}`);
                    }
                    else {
                        this.codeEmitter.add(`stores`);
                    }                
                }
            },
        },

        "access-variable": {
            post: (node) => {
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
        },

        "assignment-statement": {
            post: (node) => {

                if (!node.symbol!.isGlobal) {
                    // 
                    // Prepare a reference to the stack frame location for the variable being assigned.
                    //
                    this.codeEmitter.add(`int ${node.symbol!.position}`); // Variable position within stack frame.                    
                    this.codeEmitter.add(`load 0`); // stack_pointer
                    this.codeEmitter.add(`+`); // stack_pointer + variable_position

                    this.codeEmitter.add(`dig 1`); // Copies the earlier value to the top of stack. This is the value to be stored.
                    this.codeEmitter.add(`stores`);
                }
                else {
                    this.codeEmitter.add(`dup`); // Copies the value to be stored to top of stack. This is so that the earlier value can be used in higher expressions.
                    this.codeEmitter.add(`store ${node.symbol!.position}`);
                }
            },
        },

        "if-statement": {
            post: (node) => {                
                this.controlStatementId += 1;

                this.codeEmitter.add(`bz else_${this.controlStatementId}`);

                this.internalGenerateCode(node.ifBlock!);

                this.codeEmitter.add(`b end_${this.controlStatementId}`);

                this.codeEmitter.add(`else_${this.controlStatementId}:`);

                if (node.elseBlock) {
                    this.internalGenerateCode(node.elseBlock);
                }

                this.codeEmitter.add(`end_${this.controlStatementId}:`);
            },
        },


        "while-statement": {
            pre: (node) => {
                this.controlStatementId += 1;
                node.controlStatementId = this.controlStatementId;

                this.codeEmitter.add(`loop_start_${node.controlStatementId}:`);
            },

            post: (node) => {
                this.codeEmitter.add(`bz loop_end_${node.controlStatementId}`);
    
                this.internalGenerateCode(node.body!);
    
                this.codeEmitter.add(`b loop_start_${node.controlStatementId}`);
                this.codeEmitter.add(`loop_end_${node.controlStatementId}:`)
            },
        },

        "function-call": {
            post: (node) => {
                if (node.name === "appGlobalPut") {
                    this.codeEmitter.add(`app_global_put`);
                }
                else {
                	this.codeEmitter.add(`callsub ${node.name}`);
                }
            },
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

