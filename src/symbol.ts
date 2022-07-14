//
// Sets the type of a symbol.

import { ISymbolTable } from "./symbol-table";
import { IType } from "./type";

//
export enum SymbolType {
    Variable = 0,
    Constant = 1,
    Function = 2,
}

//
// Represents a symbol (e.g. variable, constant or function).
//
export interface ISymbol {
    
    //
    // The name of the symbol.
    //
    readonly name: string;

    //
    // The type of the symbol.
    //
    readonly type: SymbolType;

    //
    // The return type for function symbols.
    //
    returnType?: IType;

    //
    // If this symbol defines a new scope, this is the scopes symbol table.
    //
    scope?: ISymbolTable;

    //
    // Position of the symbol in scratch memory (if not a function).
    //
    readonly position?: number;

    //
    // Records if a symbol is a global.
    //
    readonly isGlobal: boolean;
}