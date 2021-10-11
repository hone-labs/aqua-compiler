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
        };

        const codeGenerator = new CodeGenerator();
        const output = codeGenerator.generateCode(node);
        expect(output).toEqual([]); // Nothing generated for an uninitialised variable.
    });

    it("can declare variable with initialiser", () => {

        const node = {
            nodeType: "declare-variable",
            name: "myVar",
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
            `store 0`,
        ]);
    });

    it("second variable is allocated at the next position in scratch memory", () => {

        const node = {
            nodeType: "block-statement",
            children: [
                {
                    nodeType: "declare-variable",
                    name: "myVar1",
                },                
                {
                    nodeType: "declare-variable",
                    name: "myVar2",
                    children: [
                        {
                            nodeType: "literal",
                            opcode: "int",
                            value: 6,
                        },
                    ],
                },                
            ],
        };

        const codeGenerator = new CodeGenerator();
        const output = codeGenerator.generateCode(node);
        expect(output).toEqual([
            `int 6`,
            `store 1`,
        ]);
    });

    it("can access variable", () => {

        const node = {
            nodeType: "block-statement",
            children: [
                {
                    nodeType: "declare-variable",
                    name: "myVar",
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
            `store 0`,
            `load 0`
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
            "bz else-1",
            "int 5",
            "b end-1",
            "else-1:",
            "end-1:",
        ]);
    });

    it("can generate code for assignment", () => {
        const node = {
            nodeType: "block-statement",
            children: [
                {
                    nodeType: "declare-variable",
                    name: "myVar",
                },
                {
                    nodeType: "assignment-statement",
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

        const codeGenerator = new CodeGenerator();
        const output = codeGenerator.generateCode(node);
        expect(output).toEqual([
            `int 2`,
            `store 0`,
        ]);

    });

    it("can call function with zero args", () => {

        const node = {
            nodeType: "function-call",
            name: "myFunction",
            children: [
            ],
        };

        const codeGenerator = new CodeGenerator();
        const output = codeGenerator.generateCode(node);
        expect(output).toEqual([
            `callsub fn-myFunction`,
        ]);
    });

    it("can call function with args", () => {

        const node = {
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

        const codeGenerator = new CodeGenerator();
        const output = codeGenerator.generateCode(node);
        expect(output).toEqual([
            `int 1`,
            `int 2`,
            `callsub fn-myFunction`,
        ]);
    });

    it("can declare a function", () => {
        const node = {
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

        const codeGenerator = new CodeGenerator();
        const output = codeGenerator.generateCode(node);
        expect(output).toEqual([
            `b program-end`,
            `fn-myFunction:`,
            `int 1`,
            `retsub`,
            `program-end:`,
        ]);

    });
});
