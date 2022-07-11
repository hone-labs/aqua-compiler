import { ISymbolResolution } from "..";
import { ASTNode } from "../../ast";
import { ISymbolTable } from "../../symbol-table";

export default function (node: ASTNode, symbolResolution: ISymbolResolution, symbolTable: ISymbolTable) {

    symbolResolution.visitChildren(node, symbolTable);
    symbolResolution.visitNode(node.body!, symbolTable);
}