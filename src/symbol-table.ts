import { ISymbol, SymbolType } from "./symbol";

//
// A lookup table for symbols.
//
export interface ISymbolTable {

    //
    // Returns true if a symbol is defined.
    //
    isDefinedLocally(name: string): boolean;

    //
    // Gets a symbol by name, returns undefined if the symbol is not defined.
    //
    get(name: string): ISymbol | undefined;

    //
    // Defines a symbol.
    //
    define(name: string, type: SymbolType): ISymbol;

    //
    // Get the number of symbols defined.
    //
    getNumSymbols(): number;
}

//
// A lookup table for symbols.
//
export class SymbolTable implements ISymbolTable {

    //
    // Lookup table.
    //
    private symbols = new Map<string, ISymbol>();

    //
    // The parent symbol table.
    // E.g. the global symbol table is the parent table for a function.
    //
    private parent?: ISymbolTable;

    //
    // Position for the next scratch variable.
    //
    private nextVariablePosition: number;

    constructor(startingVariablePosition: number, parent?: ISymbolTable) {
        this.nextVariablePosition = startingVariablePosition;
        this.parent = parent;
    }

    //
    // Returns true if a symbol is defined.
    //
    isDefinedLocally(name: string): boolean {
        return this.symbols.has(name);
    }

    //
    // Gets a symbol by name, returns undefined if the symbol is not defined.
    //
    get(name: string): ISymbol | undefined {
        //
        // Search in the local scope.
        //
        const localSymbol = this.symbols.get(name);
        if (localSymbol) {
            return localSymbol;
        }

        if (this.parent) {
            //
            // Search in the next scope up.
            //
            return this.parent.get(name);
        }

        return undefined;
    }

    //
    // Defines a symbol.
    //
    define(name: string, type: SymbolType): ISymbol {
        const symbol: ISymbol = {
            name: name,
            type: type,
            position: type !== SymbolType.Function ? this.nextVariablePosition : undefined,
            isGlobal: this.parent === undefined,
        };

        this.symbols.set(name, symbol);

        if (type !== SymbolType.Function) {
            // 
            // Not a function, prepare to allocate next variable location.
            //
            this.nextVariablePosition += 1;
        }

        return symbol;
    }
    
    //
    // Get the number of symbols defined.
    //
    getNumSymbols(): number {
        return this.symbols.size;
    }

}