import { ICodeGenerator } from "..";
import { ASTNode } from "../../ast";
import { ICodeEmitter } from "../../code-emitter";

//
// Defines a function that generates code for builtin functions.
//
type BuiltinFunctionGenFn = (node: ASTNode, codeGenerator: ICodeGenerator, codeEmitter: ICodeEmitter) => void;

//
// Lookup table for builtin functions.
//
interface IBuiltinsLookupMap {
    [index: string]: BuiltinFunctionGenFn;
}

//
// Removes quotes from a string.
//
function unquote(input: string): string {
    return input.substring(1, input.length-1);
}

//
// Handlers for implementing builtin functions.
//
const builtins: IBuiltinsLookupMap = {
    appGlobalPut: (node, codeGenerator, codeEmitter) => {
        for (const arg of node.functionArgs || []) {
            codeGenerator.visitNode(arg);
        }                

        codeEmitter.add(`app_global_put`, 0, 2);
        codeEmitter.add(`int 0`, 1, 0); // Need to balance the stack here even though this value should never be used.
    },

    appGlobalGet: (node, codeGenerator, codeEmitter) => {
        for (const arg of node.functionArgs || []) {
            codeGenerator.visitNode(arg);
        }                

        codeEmitter.add(`app_global_get`, 1, 1);
    },

    appGlobalGetEx: (node, codeGenerator, codeEmitter) => {
        for (const arg of node.functionArgs || []) {
            codeGenerator.visitNode(arg);
        }                

        codeEmitter.add(`app_global_get_ex`, 2, 2);
    },

    appGlobalDel: (node, codeGenerator, codeEmitter) => {
        for (const arg of node.functionArgs || []) {
            codeGenerator.visitNode(arg);
        }                

        codeEmitter.add(`app_global_del`, 0, 1);
        codeEmitter.add(`int 0`, 1, 0); // Need to balance the stack here even though this value should never be used.
    },

    appLocalPut: (node, codeGenerator, codeEmitter) => {
        for (const arg of node.functionArgs || []) {
            codeGenerator.visitNode(arg);
        }                

        codeEmitter.add(`app_local_put`, 0, 2);
        codeEmitter.add(`int 0`, 1, 0); // Need to balance the stack here even though this value should never be used.
    },

    appLocalGet: (node, codeGenerator, codeEmitter) => {
        for (const arg of node.functionArgs || []) {
            codeGenerator.visitNode(arg);
        }                

        codeEmitter.add(`app_local_get`, 1, 2);
    },

    appLocalGetEx: (node, codeGenerator, codeEmitter) => {
        for (const arg of node.functionArgs || []) {
            codeGenerator.visitNode(arg);
        }                

        codeEmitter.add(`app_local_get_ex`, 2, 3);
    },

    appLocalDel: (node, codeGenerator, codeEmitter) => {
        for (const arg of node.functionArgs || []) {
            codeGenerator.visitNode(arg);
        }                

        codeEmitter.add(`app_local_del`, 0, 2);
        codeEmitter.add(`int 0`, 1, 0); // Need to balance the stack here even though this value should never be used.
    },

    btoi: (node, codeGenerator, codeEmitter) => {
        for (const arg of node.functionArgs || []) {
            codeGenerator.visitNode(arg);
        }                

        codeEmitter.add(`btoi`, 1, 1);
    },

    itob: (node, codeGenerator, codeEmitter) => {
        for (const arg of node.functionArgs || []) {
            codeGenerator.visitNode(arg);
        }                

        codeEmitter.add(`itob`, 1, 1);
    },

    exit: (node, codeGenerator, codeEmitter) => {
        for (const arg of node.functionArgs || []) {
            codeGenerator.visitNode(arg);
        }                

        codeEmitter.add(`return`, 0, 0);
    },

    itxn_begin: (node, codeGenerator, codeEmitter) => {
        codeEmitter.add(`itxn_begin`, 0, 0);
        codeEmitter.add(`int 0`, 1, 0); // Need to balance the stack here even though this value should never be used.            
    },

    itxn_field: (node, codeGenerator, codeEmitter) => {
        //todo: this should really remove the first argument from the code generator.
        codeEmitter.add(`itxn_field ${unquote(node.functionArgs![0].value)}`, 0, 1);
        // Don't need the extra item on the stack here because we are discarding the first parameter which is on the stack.
    },

    itxn_submit: (node, codeGenerator, codeEmitter) => {
        codeEmitter.add(`itxn_submit`, 0, 0);
        codeEmitter.add(`int 0`, 1, 0); // Need to balance the stack here even though this value should never be used.
    },
};

export default function (node: ASTNode, codeGenerator: ICodeGenerator, codeEmitter: ICodeEmitter) {

    const builtin = builtins[node.name!];
    if (!builtin) {
        //
        // If not a builtin function generate code for arguments immediately.
        // Otherwise, builtin functions deal with their own args.
        //
        for (const arg of node.functionArgs || []) {
            codeGenerator.visitNode(arg);
        }                
    }
    
    if (builtin) {
        builtin(node, codeGenerator, codeEmitter); // Builtin functions generate inline code.
    }
    else {
        // Otherwise we "call" the user's function.
        codeEmitter.add(`callsub ${node.name}`, 1, node.functionArgs?.length || 0); //TODO: Always assuming a function returns one value. This will have to change.
    }

    //todo: at this point we need to let the emitter know how many items have been push on the stack as a result of this function.
}
