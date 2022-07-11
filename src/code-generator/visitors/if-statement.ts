import { ICodeGenerator } from "..";
import { ASTNode } from "../../ast";
import { ICodeEmitter } from "../../code-emitter";

export default function (node: ASTNode, codeGenerator: ICodeGenerator, codeEmitter: ICodeEmitter) {
    codeGenerator.visitChildren(node);
            
    const controlStatementId = codeEmitter.genId();

    codeEmitter.add(`bz else_${controlStatementId}`, 0, 1);

    codeGenerator.visitNode(node.ifBlock!);

    codeEmitter.add(`b end_${controlStatementId}`, 0, 0);

    codeEmitter.label(`else_${controlStatementId}`);

    if (node.elseBlock) {
        codeGenerator.visitNode(node.elseBlock);
    }

    codeEmitter.label(`end_${controlStatementId}`);
}
