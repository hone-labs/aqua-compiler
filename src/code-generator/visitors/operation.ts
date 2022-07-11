import { ICodeGenerator } from "..";
import { ASTNode } from "../../ast";
import { ICodeEmitter } from "../../code-emitter";

export default function (node: ASTNode, codeGenerator: ICodeGenerator, codeEmitter: ICodeEmitter) {
    codeGenerator.visitChildren(node);

    let output = node.opcode!;
    if (node.args) {
        output += ` ${node.args.join(" ")}`;
    }
    codeEmitter.add(output, node.numItemsAdded !== undefined ? node.numItemsAdded : 1, node.numItemsRemoved !== undefined ? node.numItemsRemoved : 2);
}
