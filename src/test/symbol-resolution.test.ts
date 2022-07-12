import { ASTNode } from "../ast";
import { SymbolType } from "../symbol";
import { SymbolResolution } from "../symbol-resolution";
import { SymbolTable } from "../symbol-table";

describe("symbol resolution", () => {

    //
    // Resolves symbols for an AST.
    //
    function resolveSymbols(ast: ASTNode): void {
        const symbolResolution = new SymbolResolution();
        const globalSymbolTable = new SymbolTable(1);
        symbolResolution.resolveSymbols(ast, globalSymbolTable);
    }

    it("symbol is resolved for variable declaration", () => {

        const ast: ASTNode = {
            nodeType: "declare-variable",
            assignee: {
                nodeType: "identifier",
                value: "myVar2",
            },
        };

        resolveSymbols(ast);

        expect(ast.symbol).toBeDefined();
    });

    it("symbol is resolved for variable access", () => {

        const variableAccess: ASTNode = {
            nodeType: "identifier",
            value: "myVar",
        };

        const ast = {
            nodeType: "block-statement",
            children: [
                {
                    nodeType: "declare-variable",
                    assignee: {
                        nodeType: "identifier",
                        value: "myVar",
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
                value: "myVar",
            },
        };

        const ast = {
            nodeType: "block-statement",
            children: [
                {
                    nodeType: "declare-variable",
                    assignee: {
                        nodeType: "identifier",
                        value: "myVar",
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
                value: "myVar2",
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
                value: "myVar2",
            },
        };

        const ast = {
            nodeType: "block-statement",
            children: [
                {
                    nodeType: "declare-variable",
                    assignee: {
                        nodeType: "identifier",
                        value: "myVar1",
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
                value: "myVar",
            },
        };

        const ast: ASTNode = {
            nodeType: "function-declaration",
            returnType: { "type": "void" }, 
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
                value: "myVar",
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
                value: "myVar",
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
                value: "myVar",
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
            returnType: { "type": "void" },
            body: {
                nodeType: "block-statement",
                children: [],
            },
        };

        resolveSymbols(ast);

        expect(ast.scope!.isDefinedLocally("a"));
        expect(ast.scope!.isDefinedLocally("b"));
    });

    it("symbol is resolved for function call", () => {

        const functionCall: ASTNode = {
            nodeType: "function-call",
            value: "myFunction",
            functionArgs: [],
        };

        const ast: ASTNode = {
            nodeType: "block-statement",
            children: [
                {
                    nodeType: "function-declaration",
                    value: "myFunction",
                    params: ["a", "b"],
                    returnType: { "type": "void" },
                    body: {
                        nodeType: "block-statement",
                        children: [],
                    },
                },
                functionCall,
            ],
        };

        resolveSymbols(ast);

        expect(functionCall.symbol).toBeDefined();
    });

});