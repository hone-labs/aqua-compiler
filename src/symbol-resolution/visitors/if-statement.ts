import { ISymbolResolution } from "..";
import { ASTNode } from "../../ast";
import { ISymbolTable } from "../../symbol-table";

export default function (node: ASTNode, symbolResolution: ISymbolResolution, symbolTable: ISymbolTable) {

    //TODO: if statements should have their own symbol tables.

    symbolResolution.visitChildren(node, symbolTable);

    symbolResolution.visitNode(node.ifBlock!, symbolTable);

    if (node.elseBlock) {
        symbolResolution.visitNode(node.elseBlock, symbolTable);                
    }
}