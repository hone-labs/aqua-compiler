//
// Sets the type of a symbol.
//
export enum SymbolType {
    Variable,
    Constant,
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
    // Position of the symbol in scratch memory.
    //
    readonly position: number;
}

//
// A lookup table for symbols.
//
export interface ISymbolTable {

    //
    // Returns true if a symbol is defined.
    //
    isDefined(name: string): boolean;

    //
    // Gets a symbol by name, returns undefined if the symbol is not defined.
    //
    get(name: string): ISymbol | undefined;

    //
    // Defines a symbol.
    //
    define(name: string, type: SymbolType, position: number): void;
}

//
// A lookup table for symbols.
//
export class SymbolTable {

    //
    // Lookup table.
    //
    symbols = new Map<string, ISymbol>();

    //
    // Returns true if a symbol is defined.
    //
    isDefined(name: string): boolean {
        return this.symbols.has(name);
    }

    //
    // Gets a symbol by name, returns undefined if the symbol is not defined.
    //
    get(name: string): ISymbol | undefined {
        return this.symbols.get(name);
    }

    //
    // Defines a symbol.
    //
    define(name: string, type: SymbolType, position: number): void {
        this.symbols.set(name, {
            name: name,
            type: type,
            position: position,
        });
    }

}