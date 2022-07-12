import { ISymbolResolution } from "..";
import { ASTNode } from "../../ast";
import { SymbolType } from "../../symbol";
import { ISymbolTable, SymbolTable } from "../../symbol-table";

export default function (node: ASTNode, symbolResolution: ISymbolResolution, symbolTable: ISymbolTable) {

    symbolResolution.visitChildren(node, symbolTable);

    const localSymbolTable = new SymbolTable(1, symbolTable); // The saved stack pointer occupies position 0, so local variables are occupated from position 1 in the functions stack frame.
    node.scope = localSymbolTable;

    if (symbolTable.isDefinedLocally(node.value!)) {
        throw new Error(`Symbol already declared: ${node.value!}`);
    }

    node.symbol = symbolTable.define(node.value!, SymbolType.Function);
    node.symbol.returnType = node.returnType;

    if (node.params) {
        for (const param of node.params) {
            localSymbolTable.define(param, SymbolType.Variable);
        }
    }

    symbolResolution.visitNode(node.body!, localSymbolTable);
}