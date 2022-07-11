import { ICodeGenerator } from "..";
import { ASTNode } from "../../ast";
import { ICodeEmitter } from "../../code-emitter";

export default function (node: ASTNode, codeGenerator: ICodeGenerator, codeEmitter: ICodeEmitter) {
    codeEmitter.resetStack();

    codeGenerator.visitChildren(node);

    if (codeGenerator.curFunction) {
        //
        // End of function! Jump to function cleanup code.
        //
        codeEmitter.add(`b ${codeGenerator.curFunction.value}-cleanup`, 0, 0);
    }
    else {
        //
        // Global code executes the "return" opcode to finish the entire program.
        //
        codeEmitter.add(`return`, 0, 0);
    }
}
