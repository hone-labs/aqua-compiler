import { ISymbolResolution } from "..";
import { ASTNode } from "../../ast";
import { ISymbolTable, SymbolTable, SymbolType } from "../../symbol-table";

export default function (node: ASTNode, symbolResolution: ISymbolResolution, symbolTable: ISymbolTable) {

    symbolResolution.visitChildren(node, symbolTable);
            
    const symbol = symbolTable.get(node.name!);
    if (symbol === undefined) {
        throw new Error(`Variable ${node.name} is not declared!`);
    }

    node.symbol = symbol;
}