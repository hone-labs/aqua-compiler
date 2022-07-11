import { ICodeGenerator } from "..";
import { ASTNode } from "../../ast";
import { ICodeEmitter } from "../../code-emitter";

export default function (node: ASTNode, codeGenerator: ICodeGenerator, codeEmitter: ICodeEmitter) {
    codeGenerator.visitChildren(node);

    if (node.symbol) {
        //
        // Assign top stack item to the variable.
        //
        if (!node.symbol!.isGlobal) {
            // 
            // Prepare a reference to the stack frame location for the variable being assigned.
            //
            codeEmitter.add(`int ${node.symbol!.position}`, 1, 0); // Variable position within stack frame.                    
            codeEmitter.add(`load 0`, 1, 0); // stack_pointer
            codeEmitter.add(`+`, 2, 1); // stack_pointer + variable_position

            codeEmitter.add(`dig 1`, 1, 0); // Copies the earlier value to the top of stack. This is the value to be stored.
            codeEmitter.add(`stores`, 0, 2);
        }
        else {
            codeEmitter.add(`dup`, 1, 0); // Copies the value to be stored to top of stack. This is so that the earlier value can be used in higher expressions.
            codeEmitter.add(`store ${node.symbol!.position}`, 0, 1);
        }
    }
    else if (node.symbols) {
        //
        // Assign stack items to symbols in reverse.
        //
        for (const symbol of node.symbols.reverse()) { //TODO: This can be integrated with the above!
            //todo: not sure how correct this!
            if (!symbol.isGlobal) {
                codeEmitter.add(`int ${symbol.position}`, 1, 0); // Variable position within stack frame.                    
                codeEmitter.add(`load 0`, 1, 0); // stack_pointer
                codeEmitter.add(`+`, 2, 1); // stack_pointer + variable_position

                codeEmitter.add(`dig 1`, 1, 0); // Copies the earlier value to the top of stack. This is the value to be stored.
                codeEmitter.add(`stores`, 0, 2);
            }
            else {
                codeEmitter.add(`dup`, 1, 0); // Copies the value to be stored to top of stack. This is so that the earlier value can be used in higher expressions.
                codeEmitter.add(`store ${symbol.position}`, 0, 1);
            }
        }
    }
    else {
        throw new Error(`No symbol or symbols set for assignment statement.`);
    }
}
