import { ISymbol, SymbolType } from "./symbol";
import { ISymbolTable } from "./symbol-table";
import { IType } from "./type";

//
// Defines a node in the abstract syntax tree (AST).
//
export interface ASTNode {

    //
    // The type of the node.
    //
    nodeType: string;

    //
    // Specifies the data type for the node when known and appropriate.
    //
    type?: string;

    //
    // Child nodes that should have code generated before this node.
    //
    children?: ASTNode[];

    //
    // The value at at this node.
    //
    value?: any;

    //
    // If this node references a symbol, the symbol is attached to the node by the symbol resolution pass.
    //
    symbol?: ISymbol;

    //
    // If this node references multiple symbols, the symbols are attached to the node by the symbol resolution pass.
    //
    symbols?: ISymbol[];

    //
    // If this node defines a symbol, this specifies the type of the symbol.
    //
    symbolType?: SymbolType;

    // 
    // Enables checking for assignemtn to con
    //
    checkConstantAssignment?: boolean;

    //
    // Initializer for a declaration.
    //
    initializer?: ASTNode;

    //
    // If this node defines a new scope, the scope is attached to the node by the symbol resolution pass.
    //
    scope?: ISymbolTable;

    // 
    // If a function node, this is the array of parameters.
    //
    params?: string[];

    //
    // Encodes the return type for a function.
    // 
    returnType?: IType;

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
    opcode?: string; //TODO: The parser really shouldn't care about opcodes.

    //
    // The number of items added to the stack for an opcode.
    //
    numItemsAdded?: number;

    //
    // The number of items removed from the stack for an opcode.
    //
    numItemsRemoved?: number;

    //
    // Arguments for the TEAL opcode, if any.
    //
    args?: any[];

    //
    // Arguments to the function, for function calls.
    //
    functionArgs?: ASTNode[];
}