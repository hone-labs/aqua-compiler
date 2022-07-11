import { ISymbolResolution } from "..";
import { ASTNode } from "../../ast";
import { ISymbolTable, SymbolTable, SymbolType } from "../../symbol-table";

export default function (node: ASTNode, symbolResolution: ISymbolResolution, symbolTable: ISymbolTable) {

    symbolResolution.visitChildren(node, symbolTable);

    const localSymbolTable = new SymbolTable(1, symbolTable); // The saved stack pointer occupies position 0, so local variables are occupated from position 1 in the functions stack frame.
    node.scope = localSymbolTable;

    if (node.params) {
        for (const param of node.params) {
            localSymbolTable.define(param, SymbolType.Variable);
        }
    }

    symbolResolution.visitNode(node.body!, localSymbolTable);
}