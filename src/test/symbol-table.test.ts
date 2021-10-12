import { SymbolTable, SymbolType } from "../symbol-table";

describe("symbol table", () => {

    it("can't retreive an undefined symbol", () => {

        const symbolTable = new SymbolTable(0);

        expect(symbolTable.isDefinedLocally("myVar")).toEqual(false);
        expect(symbolTable.get("myVar")).toBeUndefined();
    });

    it("can define a symbol", ()  => {

        const symbolTable = new SymbolTable(0);
        const symbol = symbolTable.define("myVar", SymbolType.Variable);
        expect(symbol.name).toEqual("myVar");

        expect(symbolTable.isDefinedLocally("myVar")).toEqual(true);
        expect(symbolTable.get("myVar")).toBeDefined();
        expect(symbolTable.get("myVar")).toBe(symbol);
    });

    it("symbol defined in parent scope is not defined in nested scope", () => {

        const parentSymbolTable = new SymbolTable(0);
        parentSymbolTable.define("myVar", SymbolType.Variable);

        const nestedSymbolTable = new SymbolTable(0, parentSymbolTable);
        expect(nestedSymbolTable.isDefinedLocally("myVar")).toEqual(false);
    });

    it("can get symbol defined in parent scope", () => {

        const parentSymbolTable = new SymbolTable(0);
        parentSymbolTable.define("myVar", SymbolType.Variable);

        const nestedSymbolTable = new SymbolTable(0, parentSymbolTable);
        expect(nestedSymbolTable.get("myVar")).toBeDefined();
        expect(nestedSymbolTable.get("myVar")?.name).toEqual("myVar");
    });
});
