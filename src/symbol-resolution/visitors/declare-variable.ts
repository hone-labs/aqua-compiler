import { ISymbolResolution } from "..";
import { ASTNode } from "../../ast";
import { ISymbolTable } from "../../symbol-table";

export default function (node: ASTNode, symbolResolution: ISymbolResolution, symbolTable: ISymbolTable) {

    symbolResolution.visitChildren(node, symbolTable);

    const assignee = node.assignee!;
    if (assignee.nodeType == "tuple") {

        node.symbols = [];

        for (const child of assignee.children!)  {

            if (child.nodeType !== "identifier") {
                throw new Error(`Expected tuple element to be an lvalue.`);
            }
            else {
                if (symbolTable.isDefinedLocally(child.value!)) {
                    throw new Error(`${child.value!} is already declared!`);
                }

                //
                // Allocates a position for the variable in scratch.
                //
                node.symbols.push(symbolTable.define(child.value!, node.symbolType!));
            }
        }
    }
    else if (assignee.nodeType !== "identifier") {
        throw new Error(`Expected assignee to be an lvalue.`);
    }
    else {
        if (symbolTable.isDefinedLocally(assignee.value!)) {
            throw new Error(`${assignee.value!} is already declared!`);
        }

        //
        // Allocates a position for the variable in scratch.
        //
        node.symbol = symbolTable.define(assignee.value!, node.symbolType!);
    }      

    if (node.initializer) {
        symbolResolution.visitNode(node.initializer, symbolTable);
    }
}