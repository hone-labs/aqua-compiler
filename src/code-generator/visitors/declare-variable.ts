import { ICodeGenerator } from "..";
import { ASTNode } from "../../ast";
import { ICodeEmitter } from "../../code-emitter";

export default function (node: ASTNode, codeGenerator: ICodeGenerator, codeEmitter: ICodeEmitter) {
    codeEmitter.resetStack();

    codeGenerator.visitChildren(node);

    if (node.initializer) {
        codeGenerator.visitNode(node.initializer);
    }

    codeEmitter.popAll();
}
