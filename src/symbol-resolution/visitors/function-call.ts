import { ISymbolResolution } from "..";
import { ASTNode } from "../../ast";
import { ISymbolTable } from "../../symbol-table";

export default function (node: ASTNode, symbolResolution: ISymbolResolution, symbolTable: ISymbolTable) {

    symbolResolution.visitChildren(node, symbolTable);

    const symbol = symbolTable.get(node.value!);
    if (symbol === undefined) {
        throw new Error(`Function ${node.value} is not declared!`);
    }

    node.symbol = symbol;

    for (const arg of node.functionArgs || []) {
        symbolResolution.visitNode(arg, symbolTable);
    }
}