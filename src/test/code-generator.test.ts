import { CodeGenerator } from "../code-generator";

describe("code generator", () => {

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

        const codeGenerator = new CodeGenerator();
        const output = codeGenerator.generateCode(node);
        expect(output).toEqual([
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

        const codeGenerator = new CodeGenerator();
        const output = codeGenerator.generateCode(node);
        expect(output).toEqual([
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

        const codeGenerator = new CodeGenerator();
        const output = codeGenerator.generateCode(node);
        expect(output).toEqual([
            `${opcode} ${value}`,
        ]);
    });    

    it("can generate code for expression statement", () => {

        const node = {
            nodeType: "expr-statement",
            children: [],
        };

        const codeGenerator = new CodeGenerator();
        const output = codeGenerator.generateCode(node);
        expect(output).toEqual([]);
    });    

    it("can generate code for return statement", () => {

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

        const codeGenerator = new CodeGenerator();
        const output = codeGenerator.generateCode(node);
        expect(output).toEqual([
            `int 1`,
            `return`,
        ]);
    });    

    it("can generate code for block", () => {

        const node = {
            nodeType: "block-statement",
            children: [],
        };

        const codeGenerator = new CodeGenerator();
        const output = codeGenerator.generateCode(node);
        expect(output).toEqual([]);
    });    

    it("can declare variable", () => {

        const node = {
            nodeType: "declare-variable",
            name: "myVar",
            position: 2,
        };

        const codeGenerator = new CodeGenerator();
        const output = codeGenerator.generateCode(node);
        expect(output).toEqual([]); // Nothing generated for an uninitialised variable.
    });

    it("can declare variable with initialiser", () => {

        const node = {
            nodeType: "declare-variable",
            name: "myVar",
            position: 2,
            children: [
                {
                    nodeType: "literal",
                    opcode: "int",
                    value: 3,        
                },
            ],
        };

        const codeGenerator = new CodeGenerator();
        const output = codeGenerator.generateCode(node);
        expect(output).toEqual([
            `int 3`,
            `store 2`,
        ]);
    });

    it("can access variable", () => {

        const node = {
            nodeType: "block-statement",
            children: [
                {
                    nodeType: "declare-variable",
                    name: "myVar",
                    position: 5,
                    children: [
                        {
                            nodeType: "literal",
                            opcode: "int",
                            value: 3,        
                        },
                    ],
                },
                {
                    nodeType: "access-variable",
                    name: "myVar",
                },       
            ],
        };

        const codeGenerator = new CodeGenerator();
        const output = codeGenerator.generateCode(node);
        expect(output).toEqual([
            `int 3`,
            `store 5`,
            `load 5`
        ]);
    });

    it("can generate code for print", () => {

        const node = {
            nodeType: "print-statement",
            children: [
                {
                    nodeType: "literal",
                    opcode: "int",
                    value: 3,        
                },
            ],
        };

        const codeGenerator = new CodeGenerator();
        const output = codeGenerator.generateCode(node);
        expect(output).toEqual([
            `int 3`,
            `print`
        ]);
    });        

    it("can generate code for if statement", () => {

        const node = {
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

        const codeGenerator = new CodeGenerator();
        const output = codeGenerator.generateCode(node);
        expect(output).toEqual([
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

        const node = {
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

        const codeGenerator = new CodeGenerator();
        const output = codeGenerator.generateCode(node);
        expect(output).toEqual([
            "int 4",
            "bz else-2",
            "int 5",
            "b end-2",
            "else-2:",
            "end-2:",
        ]);
    });
});
