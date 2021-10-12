//
// Defines a node in the abstract syntax tree (AST).
//

import { ISymbol, ISymbolTable, SymbolType } from "./symbol-table";

export interface ASTNode {

    //
    // The type of the node.
    //
    nodeType: string;

    //
    // Child nodes that should have code generated before this node.
    //
    children?: ASTNode[];

    //
    // If this node references a symbol, this is the name of that symbol.
    //
    name?: string;

    //
    // If this node references a symbol, the symbol is attached to the node by the symbol resolution pass.
    //
    symbol?: ISymbol;

    //
    // If this node defines a symbol, this specifies the type of the symbol.
    //
    symbolType?: SymbolType;

    //
    // If this node defines a new scope, the scope is attached to the node by the symbol resolution pass.
    //
    scope?: ISymbolTable;

    // 
    // If a function node, this is the array of parameters.
    //
    params?: ASTNode[];

    //
    // If a function node, this is the body of the function.
    //
    body?: ASTNode;

    //
    // If an assigment statement, this is the assignee.
    //
    assignee?: ASTNode;

    //
    // For if-statements, this is the block of code under the if.
    //
    ifBlock?: ASTNode;

    //
    // For else-statements, this is the block of code under the if.
    //
    elseBlock?: ASTNode;

    //
    // For any nodes that output a TEAL opcode directly... this is the opcode.
    //
    opcode?: string;

    //
    // For any nodes that reference a literal value, this is the value.
    //
    value?: any;

}