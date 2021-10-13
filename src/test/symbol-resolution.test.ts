import { ASTNode } from "../ast";
import { SymbolResolution } from "../symbol-resolution";
import { SymbolType } from "../symbol-table";

describe("symbol resolution", () => {

    //
    // Resolves symbols for an AST.
    //
    function resolveSymbols(ast: ASTNode): void {
        const symbolResolution = new SymbolResolution();
        symbolResolution.resolveSymbols(ast);
    }

    it("symbol is resolved for variable declaration", () => {

        const ast: ASTNode = {
            nodeType: "declare-variable",
            name: "myVar2",
        };

        resolveSymbols(ast);

        expect(ast.symbol).toBeDefined();
    });

    it("symbol is resolved for variable access", () => {

        const variableAccess: ASTNode = {
            nodeType: "access-variable",
            name: "myVar",
        };

        const ast = {
            nodeType: "block-statement",
            children: [
                {
                    nodeType: "declare-variable",
                    name: "myVar",
                },                
                variableAccess,
            ],
        };

        resolveSymbols(ast);

        expect(variableAccess.symbol).toBeDefined();
    });

    it("symbol is resolved for variable assignment", () => {

        const variableAssignment: ASTNode = {
            nodeType: "assignment-statement",
            symbol: {
                name: "myVar",
                type: SymbolType.Variable,
                position: 3,
                isGlobal: true,
            },
            children: [
                {
                    nodeType: "literal",
                    opcode: "int",
                    value: 2,
                },
            ],
            assignee: {
                nodeType: "access-variable",
                name: "myVar",
            },
        };

        const ast = {
            nodeType: "block-statement",
            children: [
                {
                    nodeType: "declare-variable",
                    name: "myVar",
                },                
            ],
        };

        resolveSymbols(ast);

        expect(variableAssignment.symbol).toBeDefined();
    });

    it("first variable is allocated at the first position in scratch memory", () => {

        const ast: ASTNode = {
            nodeType: "declare-variable",
            name: "myVar2",
        };

        resolveSymbols(ast);

        expect(ast.symbol!.position).toEqual(0);
    });

    it("second variable is allocated at the next position in scratch memory", () => {

        const declareSecondVariable: ASTNode = {
            nodeType: "declare-variable",
            name: "myVar2",
        };

        const ast = {
            nodeType: "block-statement",
            children: [
                {
                    nodeType: "declare-variable",
                    name: "myVar1",
                },                
                declareSecondVariable,                
            ],
        };

        resolveSymbols(ast);

        expect(declareSecondVariable.symbol!.position).toEqual(1);
    });

});