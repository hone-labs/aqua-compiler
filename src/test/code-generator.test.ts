import { ASTNode } from "../ast";
import { CodeGenerator } from "../code-generator";
import { SymbolResolution } from "../symbol-resolution";
import { SymbolType } from "../symbol-table";

describe("code generator", () => {

    //
    // Generates code from an AST.
    //
    function generateCode(ast: ASTNode): string[] {
        const codeGenerator = new CodeGenerator();
        return codeGenerator.generateCode(ast);
    }

    it("can generate code for children", () => {

        const opcode = "test-opcode";
        const child1 = {
            nodeType: "operator",
            opcode: opcode + "-child-1",
        };
        const child2 = {
            nodeType: "operator",
            opcode: opcode + "-child-2",
        };
        const node = {
            nodeType: "operator",
            opcode: opcode + "-parent",
            children: [
                child1,
                child2,
            ],
        };

        expect(generateCode(node)).toEqual([
            `${opcode}-child-1`,
            `${opcode}-child-2`,
            `${opcode}-parent`,
        ]);
    });

    it("can generate code for operator", () => {

        const opcode = "test-opcode";
        const node = {
            nodeType: "operator",
            opcode: opcode,
        };

        expect(generateCode(node)).toEqual([
            opcode,
        ]);
    });

    it("can generate code for literal", () => {

        const opcode = "test-opcode";
        const value = "1234";
        const node = {
            nodeType: "literal",
            opcode: opcode,
            value: value,
        };

        expect(generateCode(node)).toEqual([
            `${opcode} ${value}`,
        ]);
    });    

    it("can generate code for expression statement", () => {

        const node = {
            nodeType: "expr-statement",
            children: [],
        };

        expect(generateCode(node)).toEqual([]);
    });    

    it("can generate code for global return statement", () => {

        const node = {
            nodeType: "return-statement",
            children: [
                {
                    nodeType: "literal",
                    opcode: "int",
                    value: 1,
                },
            ],
        };

        expect(generateCode(node)).toEqual([
            `int 1`,
            `return`,
        ]);
    });    

    it("can generate code for block", () => {

        const node = {
            nodeType: "block-statement",
            children: [],
        };

        expect(generateCode(node)).toEqual([]);
    });    

    it("can declare variable", () => {

        const node = {
            nodeType: "declare-variable",
            name: "myVar",
        };

        expect(generateCode(node)).toEqual([]); // Nothing generated for an uninitialised variable.
    });

    it("can declare variable with initialiser", () => {

        const node: ASTNode = {
            nodeType: "declare-variable",
            name: "myVar",
            symbol: {
                name: "myVar",
                type: SymbolType.Variable,
                position: 4,
            },
            children: [
                {
                    nodeType: "literal",
                    opcode: "int",
                    value: 3,        
                },
            ],
        };

        expect(generateCode(node)).toEqual([
            `int 3`,
            `store 4`,
        ]);
    });

    it("can access variable", () => {

        const node: ASTNode = {
            nodeType: "access-variable",
            name: "myVar",
            symbol: {
                name: "myVar",
                type: SymbolType.Variable,
                position: 2,
            },
        };

        expect(generateCode(node)).toEqual([
            `load 2`
        ]);
    });

    it("can generate code for if statement", () => {

        const node: ASTNode = {
            nodeType: "if-statement",
            children: [
                {
                    nodeType: "literal",
                    opcode: "int",
                    value: 4,
                },
            ],
            ifBlock: {
                nodeType: "block-statement",
                children: [
                    {
                        nodeType: "literal",
                        opcode: "int",
                        value: 5,
                    },
                ],
            },
            elseBlock: {
                nodeType: "block-statement",
                children: [
                    {
                        nodeType: "literal",
                        opcode: "int",
                        value: 6,
                    },   
                ],
            },
        };

        expect(generateCode(node)).toEqual([
            "int 4",
            "bz else-1",
            "int 5",
            "b end-1",
            "else-1:",
            "int 6",
            "end-1:",
        ]);
    });

    it("can generate code for if statement with no else block", () => {

        const node: ASTNode = {
            nodeType: "if-statement",
            children: [
                {
                    nodeType: "literal",
                    opcode: "int",
                    value: 4,
                },
            ],
            ifBlock: {
                nodeType: "block-statement",
                children: [
                    {
                        nodeType: "literal",
                        opcode: "int",
                        value: 5,
                    },
                ],
            },
        };

        expect(generateCode(node)).toEqual([
            "int 4",
            "bz else-1",
            "int 5",
            "b end-1",
            "else-1:",
            "end-1:",
        ]);
    });

    it("can generate code for assignment", () => {
        const node: ASTNode = {
            nodeType: "block-statement",
            children: [
                {
                    nodeType: "declare-variable",
                    name: "myVar",
                },
                {
                    nodeType: "assignment-statement",
                    symbol: {
                        name: "myVar",
                        type: SymbolType.Variable,
                        position: 3,
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
                },       
            ],
        };

        expect(generateCode(node)).toEqual([
            `int 2`,
            `store 3`,
        ]);
    });

    it("can call function with zero args", () => {

        const node: ASTNode = {
            nodeType: "function-call",
            name: "myFunction",
            children: [
            ],
        };

        expect(generateCode(node)).toEqual([
            `callsub fn-myFunction`,
        ]);
    });

    it("can call function with args", () => {

        const node: ASTNode = {
            nodeType: "function-call",
            name: "myFunction",
            children: [
                {
                    nodeType: "literal",
                    opcode: "int",
                    value: 1,
                },
                {
                    nodeType: "literal",
                    opcode: "int",
                    value: 2,
                },
            ],
        };

        expect(generateCode(node)).toEqual([
            `int 1`,
            `int 2`,
            `callsub fn-myFunction`,
        ]);
    });

    it("can declare a function", () => {
        const node: ASTNode = {
            nodeType: "function-declaration",
            name: "myFunction",
            params: [],
            body: {
                nodeType: "return-statement",
                children: [
                    {
                        nodeType: "literal",
                        opcode: "int",
                        value: 1,
                    },        
                ],
            },
        };

        expect(generateCode(node)).toEqual([
            `b program-end`,
            `fn-myFunction:`,
            `int 1`,
            `retsub`,
            `retsub`,
            `program-end:`,
        ]);

    });

    it("function return is synthesized when not explicit", () => {
        const node: ASTNode = {
            nodeType: "function-declaration",
            name: "myFunction",
            params: [],
            body: {
                nodeType: "literal",
                opcode: "int",
                value: 1,
            },
        };

        expect(generateCode(node)).toEqual([
            `b program-end`,
            `fn-myFunction:`,
            `int 1`,
            `retsub`,
            `program-end:`,
        ]);

    });
});
