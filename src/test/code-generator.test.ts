import { ASTNode } from "../ast";
import { CodeEmitter, ICodeBlock } from "../code-emitter";
import { CodeGenerator } from "../code-generator";
import { SymbolType } from "../symbol-table";

describe("code generator", () => {

    //
    // Generates code from an AST.
    //
    function generateCode(ast: ASTNode): string[] {
        const codeEmitter = new CodeEmitter(false);
        const codeGenerator = new CodeGenerator(codeEmitter);
        codeGenerator.generateCode(ast);
        const output = codeEmitter.getOutput();
        return output;
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
                isGlobal: true,
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
                isGlobal: true,
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
        const ast: any = {
            nodeType: "function-declaration",
            name: "myFunction",
            params: [],
            scope: {
                getNumSymbols: () => 0,
            },
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

        const codeEmitter = new CodeEmitter(false);
        const codeGenerator = new CodeGenerator(codeEmitter);
        codeGenerator.generateCode(ast);

        const output = codeEmitter.getBlocks()
            .filter(block => block.tags.indexOf("setup") < 0) // Filter out setup blocks.
            .flatMap(block => block.elements)
            .map(element => element.code);

        expect(output).toEqual([
            "fn-myFunction:",
            "int 1",
            "retsub",
        ]);
    });

    it("function return is synthesized when not explicit", () => {
        const node: any = {
            nodeType: "function-declaration",
            name: "myFunction",
            params: [],
            scope: {
                getNumSymbols: () => 0,
            },
            body: {
                nodeType: "literal",
                opcode: "int",
                value: 1,
            },
        };

        expect(generateCode(node)).toEqual([
            "",
            "int 256",
            "store 0",
            "",
            "b program-end",
            "fn-myFunction:",
            "",
            "load 0",
            "",
            "",
            "load 0",
            "int 1",
            "-",
            "store 0",
            "load 0",
            "swap",
            "stores",
            "",
            "",
            "",
            "int 1",
            "",
            "load 0",
            "loads",
            "save 0",
            "retsub",
            "",
            "program-end:"
        ]);
    });
});
