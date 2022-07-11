import { ICodeGenerator } from "..";
import { ASTNode } from "../../ast";
import { ICodeEmitter } from "../../code-emitter";

export default function (node: ASTNode, codeGenerator: ICodeGenerator, codeEmitter: ICodeEmitter) {
    codeEmitter.add(`byte \"${node.value!}\"`, 1, 0);
}
