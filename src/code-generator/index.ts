import { ASTNode } from "../ast";
import { ICodeEmitter } from "../code-emitter";
import { MAX_SCRATCH } from "../config";

//
// Defines a function that can visit nodes in the AST to generate code.
//
type NodeVisitorFn = (node: ASTNode, codeGenerator: ICodeGenerator, codeEmitter: ICodeEmitter) => void;

//
// Lookup table for AST node visitor functions.
//
interface INodeVisitorMap {
    [index: string]: NodeVisitorFn;
}

//
// Defines a function that generates code for builtin functions.
//
type BuiltinFunctionGenFn = (node: ASTNode) => void;

//
// Lookup table for builtin functions.
//
interface IBuiltinsLookupMap {
    [index: string]: BuiltinFunctionGenFn;
}

//
// Handles TEAL code generation for the Aqua compiler.
//
export interface ICodeGenerator {
    //
    // Visits a node to generate code.
    //
    visitNode(node: ASTNode): void;

    //
    // Visits each child to generate code.
    //
    visitChildren(node: ASTNode): void;
}

//
// Handles TEAL code generation for the Aqua compiler.
//
export class CodeGenerator implements ICodeGenerator {

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
            this.codeEmitter.section(`Function data stack setup.`);
            this.codeEmitter.add(`int ${MAX_SCRATCH}`, 1, 0, `Initial stack pointer.`);
            this.codeEmitter.add(`store 0`, 0, 1, `Set stack_pointer`);
            this.codeEmitter.section();
        }

        //
        // Generate code for non functions.
        //
        this.visitNode(ast);

        if (this.functions.length > 0) {
            //
            // Ensures the code for functions is never executed unless we specifically call the function.
            //
            this.codeEmitter.add(`b program_end`, 0, 0); 

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

            this.codeEmitter.section();
            this.codeEmitter.label(`program_end`);
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

        this.codeEmitter.label(functionNode.name!);

        this.codeEmitter.section(`Function setup.`);
        this.codeEmitter.add(`load 0`, 1, 0, `Take copy of current stack_pointer on stack so that we can save it as the "previous stack pointer" in the new stack frame.`);

        // 
        // Decrement the stack pointer by the amount of variables used by the function.
        //
        this.codeEmitter.section(`Allocate stack frame for the function being called and update the stack_pointer.`);
        this.codeEmitter.section(`stack_pointer = stack_pointer - (num_locals+1)`);
        this.codeEmitter.add(`load 0`, 1, 0, `stack_pointer`);
        this.codeEmitter.add(`int ${functionNode.scope!.getNumSymbols()+1}`, 1, 0, `num_locals+1`); // Amount used by this function + 1 for saved stack_pointer.
        this.codeEmitter.add(`-`, 2, 1, `stack_pointer - (num_locals+1)`); // stack_pointer - (num_locals+1)
        this.codeEmitter.add(`store 0`, 0, 1, `stack_pointer = stack_pointer - (num_locals+1)`); // stack_pointer = stack_pointer - (num_locals+1)

        //
        // Store previous stack pointer at position one in the new stack frame 
        // (so that the previous stack frame can be restored after this function has returned).
        //
        this.codeEmitter.add(`load 0`, 1, 0, `Loads the stack_pointer for the new stack frame, this is where we'll store the previous stack pointer.`); // Loads the stack_pointer for the new stack frame, this is where we'll store the previous stack pointer.
        this.codeEmitter.add(`swap`, 2, 2, `The values on the compute stack are in the wrong order, swap so they are in the right order.`); // The values on the compute stack are in the wrong order, swap so they are in the right order.
        this.codeEmitter.add(`stores`, 0, 2, `Stores previous stack pointer at the first position in the new stack frame.`); // Stores previous stack pointer at the first position in the new stack frame.
        this.codeEmitter.section();

        if (functionNode.params) {
            this.codeEmitter.section(`Setup arguments.`);

            for (const param of functionNode.params.reverse()) { // Parameters are popped from the stack in reverse order to what they are pushed.
                const symbol = functionNode.scope!.get(param); 
                this.codeEmitter.add(`int ${symbol!.position}`, 1, 0); // Variable position within stack frame.                    
                this.codeEmitter.add(`load 0`, 1, 0); // stack_pointer
                this.codeEmitter.add(`+`, 2, 1); // stack_pointer + variable_position
                this.codeEmitter.add(`stores`, 0, 2, `Stores "${param}".`);
            }
        }

        this.codeEmitter.section(`Function body.`);

        //
        // Now we can generate code for the function.
        //
        this.visitNode(functionNode.body!);

        // 
        // Restore the original stack pointer.
        //
        this.codeEmitter.label(`${functionNode.name}-cleanup`, `Function cleanup. Restores the previous stack frame`);
        this.codeEmitter.add(`load 0`, 1, 0, `Loads current stack_pointer`)
        this.codeEmitter.add(`loads`, 1, 1, `Loads previous_stack_pointer`);
        this.codeEmitter.add(`store 0`, 0, 1, `stack_pointer = previous_stack_pointer`); // Restore stack_pointer to previous_stack_pointer.

        //
        // Return from the function if not already done so explicitly.
        //
        this.codeEmitter.add(`retsub`, 0, 0, `Catch all return.`);
    }

    //
    // Visits a node to generate code.
    //
    visitNode(node: ASTNode): void {
        let visitor = this.visitors[node.nodeType];
        if (!visitor) {
            //
            // Load visitor.
            //
            visitor =  this.visitors[node.nodeType] = require(`./visitors/${node.nodeType}`).default;
            if (!visitor) {
                throw new Error(`No visitor for node ${node.nodeType}`);
            }
        }

        visitor(node, this, this.codeEmitter);
    }

    //
    // Visits each child to generate code.
    //
    visitChildren(node: ASTNode): void {
        if (node.children) {
            for (const child of node.children) {
                this.visitNode(child);
            }
        }
    }

    //
    // Code to be invoked to visit each node in the AST.
    //
    visitors: INodeVisitorMap = {

        "expr-statement": (node) => {
            this.codeEmitter.resetStack();

            this.visitChildren(node);

            this.codeEmitter.popAll();
        },

        "return-statement": (node) => {
            this.codeEmitter.resetStack();

            this.visitChildren(node);

            if (this.inFunction) {
                //
                // End of function! Jump to function cleanup code.
                //
                this.codeEmitter.add(`b ${this.curFunction!.name}-cleanup`, 0, 0);
            }
            else {
                //
                // Global code executes the "return" opcode to finish the entire program.
                //
                this.codeEmitter.add(`return`, 0, 0);
            }
        },
        
        "declare-variable": (node) => {
            this.codeEmitter.resetStack();

            this.visitChildren(node);

            if (node.initializer) {
                this.visitNode(node.initializer);
            }

            this.codeEmitter.popAll();
        },

        "access-variable": (node) => {
            this.visitChildren(node);

            if (node.symbol!.isGlobal) {                    
                this.codeEmitter.add(`load ${node.symbol!.position}`, 1, 0);
            }
            else {
                this.codeEmitter.add(`load 0`, 1, 0); // stack_pointer
                this.codeEmitter.add(`int ${node.symbol!.position}`, 1, 0); // Variable position within stack frame.                    
                this.codeEmitter.add(`+`, 2, 1); // stack_pointer + variable_position
                this.codeEmitter.add(`loads`, 1, 1); // Loads variable onto stack.
            }
        },

        "assignment-statement": (node) => {
            this.visitChildren(node);

            if (node.symbol) {
                //
                // Assign top stack item to the variable.
                //
                if (!node.symbol!.isGlobal) {
                    // 
                    // Prepare a reference to the stack frame location for the variable being assigned.
                    //
                    this.codeEmitter.add(`int ${node.symbol!.position}`, 1, 0); // Variable position within stack frame.                    
                    this.codeEmitter.add(`load 0`, 1, 0); // stack_pointer
                    this.codeEmitter.add(`+`, 2, 1); // stack_pointer + variable_position

                    this.codeEmitter.add(`dig 1`, 1, 0); // Copies the earlier value to the top of stack. This is the value to be stored.
                    this.codeEmitter.add(`stores`, 0, 2);
                }
                else {
                    this.codeEmitter.add(`dup`, 1, 0); // Copies the value to be stored to top of stack. This is so that the earlier value can be used in higher expressions.
                    this.codeEmitter.add(`store ${node.symbol!.position}`, 0, 1);
                }
            }
            else if (node.symbols) {
                //
                // Assign stack items to symbols in reverse.
                //
                for (const symbol of node.symbols.reverse()) { //TODO: This can be integrated with the above!
                    //todo: not sure how correct this!
                    if (!symbol.isGlobal) {
                        this.codeEmitter.add(`int ${symbol.position}`, 1, 0); // Variable position within stack frame.                    
                        this.codeEmitter.add(`load 0`, 1, 0); // stack_pointer
                        this.codeEmitter.add(`+`, 2, 1); // stack_pointer + variable_position
    
                        this.codeEmitter.add(`dig 1`, 1, 0); // Copies the earlier value to the top of stack. This is the value to be stored.
                        this.codeEmitter.add(`stores`, 0, 2);
                    }
                    else {
                        this.codeEmitter.add(`dup`, 1, 0); // Copies the value to be stored to top of stack. This is so that the earlier value can be used in higher expressions.
                        this.codeEmitter.add(`store ${symbol.position}`, 0, 1);
                    }
                }
            }
            else {
                throw new Error(`No symbol or symbols set for assignment statement.`);
            }
        },

        "if-statement": (node) => {                
            this.visitChildren(node);
            
            this.controlStatementId += 1;
            node.controlStatementId = this.controlStatementId;

            this.codeEmitter.add(`bz else_${node.controlStatementId}`, 0, 1);

            this.visitNode(node.ifBlock!);

            this.codeEmitter.add(`b end_${node.controlStatementId}`, 0, 0);

            this.codeEmitter.label(`else_${node.controlStatementId}`);

            if (node.elseBlock) {
                this.visitNode(node.elseBlock);
            }

            this.codeEmitter.label(`end_${node.controlStatementId}`);
        },

        "while-statement": (node) => {
            this.controlStatementId += 1;
            node.controlStatementId = this.controlStatementId;

            this.codeEmitter.label(`loop_start_${node.controlStatementId}`);

            this.visitChildren(node);

            this.codeEmitter.add(`bz loop_end_${node.controlStatementId}`, 0, node.children!.length > 0 ? 1 : 0);

            this.visitNode(node.body!);

            this.codeEmitter.add(`b loop_start_${node.controlStatementId}`, 0, 0);
            this.codeEmitter.label(`loop_end_${node.controlStatementId}`)
        },

        "function-declaration": (node) => {
            this.visitChildren(node);
        },

        "function-call": (node) => {
            const builtin = this.builtins[node.name!];
            if (!builtin) {
                //
                // If not a builtin function generate code for arguments immediately.
                //
                for (const arg of node.functionArgs || []) {
                    this.visitNode(arg);
                }                
            }

            this.visitChildren(node);
            
            if (builtin) {
                builtin(node); // Builtin functions generate inline code.
            }
            else {
                // Otherwise we "call" the user's function.
                this.codeEmitter.add(`callsub ${node.name}`, 1, node.functionArgs?.length || 0); //TODO: Always assuming a function returns one value. This will have to change.
            }

            //todo: at this point we need to let the emitter know how many items have been push on the stack as a result of this function.
        },

        "block-statement": (node) => {
            this.visitChildren(node);
        },

        "tuple": (node) => {
            this.visitChildren(node);
        },
    };

    //
    // Handlers for implementing builtin functions.
    //
    private builtins: IBuiltinsLookupMap = {
        appGlobalPut: (node) => {
            for (const arg of node.functionArgs || []) {
                this.visitNode(arg);
            }                

            this.codeEmitter.add(`app_global_put`, 0, 2);
            this.codeEmitter.add(`int 0`, 1, 0); // Need to balance the stack here even though this value should never be used.
        },

        appGlobalGet: (node) => {
            for (const arg of node.functionArgs || []) {
                this.visitNode(arg);
            }                

            this.codeEmitter.add(`app_global_get`, 1, 1);
        },

        appGlobalGetEx: (node) => {
            for (const arg of node.functionArgs || []) {
                this.visitNode(arg);
            }                

            this.codeEmitter.add(`app_global_get_ex`, 2, 2);
        },

        appGlobalDel: (node) => {
            for (const arg of node.functionArgs || []) {
                this.visitNode(arg);
            }                

            this.codeEmitter.add(`app_global_del`, 0, 1);
            this.codeEmitter.add(`int 0`, 1, 0); // Need to balance the stack here even though this value should never be used.
        },

        appLocalPut: (node) => {
            for (const arg of node.functionArgs || []) {
                this.visitNode(arg);
            }                

            this.codeEmitter.add(`app_local_put`, 0, 2);
            this.codeEmitter.add(`int 0`, 1, 0); // Need to balance the stack here even though this value should never be used.
        },

        appLocalGet: (node) => {
            for (const arg of node.functionArgs || []) {
                this.visitNode(arg);
            }                

            this.codeEmitter.add(`app_local_get`, 1, 2);
        },

        appLocalGetEx: (node) => {
            for (const arg of node.functionArgs || []) {
                this.visitNode(arg);
            }                

            this.codeEmitter.add(`app_local_get_ex`, 2, 3);
        },

        appLocalDel: (node) => {
            for (const arg of node.functionArgs || []) {
                this.visitNode(arg);
            }                

            this.codeEmitter.add(`app_local_del`, 0, 2);
            this.codeEmitter.add(`int 0`, 1, 0); // Need to balance the stack here even though this value should never be used.
        },

        btoi: (node) => {
            for (const arg of node.functionArgs || []) {
                this.visitNode(arg);
            }                

            this.codeEmitter.add(`btoi`, 1, 1);
        },

        itob: (node) => {
            for (const arg of node.functionArgs || []) {
                this.visitNode(arg);
            }                

            this.codeEmitter.add(`itob`, 1, 1);
        },

        exit: (node) => {
            for (const arg of node.functionArgs || []) {
                this.visitNode(arg);
            }                

            this.codeEmitter.add(`return`, 0, 0);
        },

        itxn_begin: (node) => {
            this.codeEmitter.add(`itxn_begin`, 0, 0);
            this.codeEmitter.add(`int 0`, 1, 0); // Need to balance the stack here even though this value should never be used.            
        },

        itxn_field: (node) => {
            //todo: this should really remove the first argument from the code generator.
            this.codeEmitter.add(`itxn_field ${unquote(node.functionArgs![0].value)}`, 0, 1);
            // Don't need the extra item on the stack here because we are discarding the first parameter which is on the stack.
        },

        itxn_submit: (node) => {
            this.codeEmitter.add(`itxn_submit`, 0, 0);
            this.codeEmitter.add(`int 0`, 1, 0); // Need to balance the stack here even though this value should never be used.
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

//
// Removes quotes from a string.
//
function unquote(input: string): string {
    return input.substring(1, input.length-1);
}