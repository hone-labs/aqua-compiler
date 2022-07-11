import { ISymbolResolution } from "..";
import { ASTNode } from "../../ast";
import { ISymbolTable, SymbolTable, SymbolType } from "../../symbol-table";

export default function (node: ASTNode, symbolResolution: ISymbolResolution, symbolTable: ISymbolTable) {

    symbolResolution.visitChildren(node, symbolTable);

    const assignee = node.assignee!;
    if (assignee.nodeType == "tuple") {

        node.symbols = [];

        for (const child of assignee.children!)  {

            if (child.nodeType !== "access-variable") {
                throw new Error(`Expected tuple element to be an lvalue.`);
            }
            else {
                if (symbolTable.isDefinedLocally(child.name!)) {
                    throw new Error(`${child.name!} is already declared!`);
                }

                //
                // Allocates a position for the variable in scratch.
                //
                node.symbols.push(symbolTable.define(child.name!, node.symbolType!));
            }
        }
    }
    else if (assignee.nodeType !== "access-variable") {
        throw new Error(`Expected assignee to be an lvalue.`);
    }
    else {
        if (symbolTable.isDefinedLocally(assignee.name!)) {
            throw new Error(`${assignee.name!} is already declared!`);
        }

        //
        // Allocates a position for the variable in scratch.
        //
        node.symbol = symbolTable.define(assignee.name!, node.symbolType!);
    }      

    if (node.initializer) {
        symbolResolution.visitNode(node.initializer, symbolTable);
    }
}