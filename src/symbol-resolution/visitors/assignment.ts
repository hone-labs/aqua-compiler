import { ISymbolResolution } from "..";
import { ASTNode } from "../../ast";
import { SymbolType } from "../../symbol";
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
                const symbol = symbolTable.get(child.value!);
                if (symbol === undefined) {
                    throw new Error(`Variable ${child.value} is not declared!`);
                }

                if (node.checkConstantAssignment && symbol.type !== SymbolType.Variable) {
                    throw new Error(`Can't set ${symbol.name} because it is not a variable.`);
                }
            
                node.symbols.push(symbol);
            }
        }
    }
    else if (assignee.nodeType !== "identifier") {
        throw new Error(`Expected assignee to be an lvalue.`);
    }
    else {
        const symbol = symbolTable.get(assignee.value!);
        if (symbol === undefined) {
            throw new Error(`Variable ${assignee.value} is not declared!`);
        }

        if (node.checkConstantAssignment && symbol.type !== SymbolType.Variable) {
            throw new Error(`Can't set ${symbol.name} because it is not a variable.`);
        }
    
        node.symbol = symbol;
    }       
``}