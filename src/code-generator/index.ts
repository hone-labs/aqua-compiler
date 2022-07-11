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

    //
    // Tracks the function for which we are generating code.
    //
    readonly curFunction?: ASTNode;
}

//
// Handles TEAL code generation for the Aqua compiler.
//
export class CodeGenerator implements ICodeGenerator {

    //
    // A list of functions to be output at the end.
    //
    private functions: ASTNode[] = [];

    //
    // Tracks the function for which we are generating code.
    //
    curFunction?: ASTNode = undefined;

    constructor(private codeEmitter: ICodeEmitter) {
    }

    //
    // Generates code from an AST representation of an Aqua script.
    //
    generateCode(ast: ASTNode): void {

        //
        // To start with we generate global code.
        //
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

        "block-statement": (node) => {
            this.visitChildren(node);
        },

        "tuple": (node) => {
            this.visitChildren(node);
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