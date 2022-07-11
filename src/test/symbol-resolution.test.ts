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
            assignee: {
                nodeType: "identifier",
                name: "myVar2",
            },
        };

        resolveSymbols(ast);

        expect(ast.symbol).toBeDefined();
    });

    it("symbol is resolved for variable access", () => {

        const variableAccess: ASTNode = {
            nodeType: "identifier",
            name: "myVar",
        };

        const ast = {
            nodeType: "block-statement",
            children: [
                {
                    nodeType: "declare-variable",
                    assignee: {
                        nodeType: "identifier",
                        name: "myVar",
                    },
                },                
                variableAccess,
            ],
        };

        resolveSymbols(ast);

        expect(variableAccess.symbol).toBeDefined();
    });

    it("symbol is resolved for variable assignment", () => {

        const variableAssignment: ASTNode = {
            nodeType: "assignment",
            symbol: {
                name: "myVar",
                type: SymbolType.Variable,
                position: 3,
                isGlobal: true,
            },
            children: [
                {
                    nodeType: "operation",
                    opcode: "int",
                    args: [ 2 ],
                },
            ],
            assignee: {
                nodeType: "identifier",
                name: "myVar",
            },
        };

        const ast = {
            nodeType: "block-statement",
            children: [
                {
                    nodeType: "declare-variable",
                    assignee: {
                        nodeType: "identifier",
                        name: "myVar",
                    },
                },                
            ],
        };

        resolveSymbols(ast);

        expect(variableAssignment.symbol).toBeDefined();
    });

    it("first variable is allocated at the first position in scratch memory", () => {

        const ast: ASTNode = {
            nodeType: "declare-variable",
            assignee: {
                nodeType: "identifier",
                name: "myVar2",
            },
        };

        resolveSymbols(ast);

        expect(ast.symbol!.position).toEqual(1);
    });

    it("second variable is allocated at the next position in scratch memory", () => {

        const declareSecondVariable: ASTNode = {
            nodeType: "declare-variable",
            assignee: {
                nodeType: "identifier",
                name: "myVar2",
            },
        };

        const ast = {
            nodeType: "block-statement",
            children: [
                {
                    nodeType: "declare-variable",
                    assignee: {
                        nodeType: "identifier",
                        name: "myVar1",
                    },        
                },                
                declareSecondVariable,                
            ],
        };

        resolveSymbols(ast);

        expect(declareSecondVariable.symbol!.position).toEqual(2);
    });

    it("symbols within function body are resolved", () => {

        const declareVariable: ASTNode = {
            nodeType: "declare-variable",
            assignee: {
                nodeType: "identifier",
                name: "myVar",
            },
        };

        const ast = {
            nodeType: "function-declaration",
            body: declareVariable,
        };

        resolveSymbols(ast);

        expect(declareVariable.symbol).toBeDefined();      
        expect(declareVariable.symbol!.name).toBe("myVar");
    });

    it("symbols within if block are resolved", () => {

        const declareVariable: ASTNode = {
            nodeType: "declare-variable",
            assignee: {
                nodeType: "identifier",
                name: "myVar",
            },
        };

        const ast = {
            nodeType: "if-statement",
            ifBlock: declareVariable,
        };

        resolveSymbols(ast);

        expect(declareVariable.symbol).toBeDefined();      
        expect(declareVariable.symbol!.name).toBe("myVar");
    });

    it("symbols within else block are resolved", () => {

        const declareVariable: ASTNode = {
            nodeType: "declare-variable",
            assignee: {
                nodeType: "identifier",
                name: "myVar",
            },
        };

        const ast = {
            nodeType: "if-statement",
            ifBlock: {
                nodeType: "block-statement",
                children: [],
            },
            elseBlock: declareVariable,
        };

        resolveSymbols(ast);

        expect(declareVariable.symbol).toBeDefined();      
        expect(declareVariable.symbol!.name).toBe("myVar");

    });

    it("symbols within while body are resolved", () => {
        const declareVariable: ASTNode = {
            nodeType: "declare-variable",
            assignee: {
                nodeType: "identifier",
                name: "myVar",
            },
        };

        const ast = {
            nodeType: "while-statement",
            body: declareVariable,
        };

        resolveSymbols(ast);

        expect(declareVariable.symbol).toBeDefined();      
        expect(declareVariable.symbol!.name).toBe("myVar");

    });

    it("function arguments are defined as local variables", () => {

        const ast: ASTNode = {
            nodeType: "function-declaration",
            params: ["a", "b"],
            body: {
                nodeType: "block-statement",
                children: [],
            },
        };

        resolveSymbols(ast);

        expect(ast.scope!.isDefinedLocally("a"));
        expect(ast.scope!.isDefinedLocally("b"));
    });

});