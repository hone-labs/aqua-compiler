import { SymbolTable, SymbolType } from "../symbol-table";

describe("symbol table", () => {

    it("can't retreive an undefined symbol", () => {

        const symbolTable = new SymbolTable();

        expect(symbolTable.isDefinedLocally("myVar")).toEqual(false);
        expect(symbolTable.get("myVar")).toBeUndefined();
    });

    it("can define a symbol", ()  => {

        const symbolTable = new SymbolTable();
        symbolTable.define("myVar", SymbolType.Variable, 0);

        expect(symbolTable.isDefinedLocally("myVar")).toEqual(true);
        expect(symbolTable.get("myVar")).toBeDefined();
        expect(symbolTable.get("myVar")?.name).toEqual("myVar");
    });

    it("symbol defined in parent scope is not defined in nested scope", () => {

        const parentSymbolTable = new SymbolTable();
        parentSymbolTable.define("myVar", SymbolType.Variable, 0);

        const nestedSymbolTable = new SymbolTable(parentSymbolTable);
        expect(nestedSymbolTable.isDefinedLocally("myVar")).toEqual(false);
    });

    it("can get symbol defined in parent scope", () => {

        const parentSymbolTable = new SymbolTable();
        parentSymbolTable.define("myVar", SymbolType.Variable, 0);

        const nestedSymbolTable = new SymbolTable(parentSymbolTable);
        expect(nestedSymbolTable.get("myVar")).toBeDefined();
        expect(nestedSymbolTable.get("myVar")?.name).toEqual("myVar");
    });

});
