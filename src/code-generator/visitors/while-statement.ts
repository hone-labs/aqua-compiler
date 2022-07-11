import { ICodeGenerator } from "..";
import { ASTNode } from "../../ast";
import { ICodeEmitter } from "../../code-emitter";

export default function (node: ASTNode, codeGenerator: ICodeGenerator, codeEmitter: ICodeEmitter) {
    const controlStatementId = codeEmitter.genId();

    codeEmitter.label(`loop_start_${controlStatementId}`);

    codeGenerator.visitChildren(node);

    codeEmitter.add(`bz loop_end_${controlStatementId}`, 0, node.children!.length > 0 ? 1 : 0);

    codeGenerator.visitNode(node.body!);

    codeEmitter.add(`b loop_start_${controlStatementId}`, 0, 0);
    codeEmitter.label(`loop_end_${controlStatementId}`)
}
