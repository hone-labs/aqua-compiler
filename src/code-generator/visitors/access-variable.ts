import { ICodeGenerator } from "..";
import { ASTNode } from "../../ast";
import { ICodeEmitter } from "../../code-emitter";

export default function (node: ASTNode, codeGenerator: ICodeGenerator, codeEmitter: ICodeEmitter) {
    codeGenerator.visitChildren(node);

    if (node.symbol!.isGlobal) {                    
        codeEmitter.add(`load ${node.symbol!.position}`, 1, 0);
    }
    else {
        codeEmitter.add(`load 0`, 1, 0); // stack_pointer
        codeEmitter.add(`int ${node.symbol!.position}`, 1, 0); // Variable position within stack frame.                    
        codeEmitter.add(`+`, 2, 1); // stack_pointer + variable_position
        codeEmitter.add(`loads`, 1, 1); // Loads variable onto stack.
    }
}
