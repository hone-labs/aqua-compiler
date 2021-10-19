import { ASTNode } from "../ast";
import { CodeEmitter } from "../code-emitter";
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

        const node = {
            nodeType: "operation",
            opcode: "op-parent",
            children: [
                {
            nodeType: "operation",
                    opcode: "op-child-1",
                },
                {
            nodeType: "operation",
                    opcode: "op-child-2",
                },
            ],
        };

        expect(generateCode(node)).toEqual([
            `op-child-1`,
            `op-child-2`,
            `op-parent`,
        ]);
    });

    it("can generate code for operation", () => {

        const node = {
            nodeType: "operation",
            opcode: "op",
        };

        expect(generateCode(node)).toEqual([
            "op",
        ]);
    });

    it("can generate code for operation with arg", () => {

        const opcode = "test-opcode";
        const value = "1234";
        const node = {
            nodeType: "operation",
            opcode: opcode,
            args: [ value ],
        };

        expect(generateCode(node)).toEqual([
            `${opcode} ${value}`,
        ]);
    });    

    it("can generate code for operation with multiple args", () => {

        const node = {
            nodeType: "operation",
            opcode: "op",
            args: [ 1, 2, 3 ],
        };

        expect(generateCode(node)).toEqual([
            `op 1 2 3`,
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
                    nodeType: "operation",
                    opcode: "int",
                    args: [ 1 ],
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
                    nodeType: "operation",
                    opcode: "int",
                    args: [ 3 ],
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
                    nodeType: "operation",
                    opcode: "int",
                    args: [ 4 ],
                },
            ],
            ifBlock: {
                nodeType: "block-statement",
                children: [
                    {
                        nodeType: "operation",
                        opcode: "int",
                        args: [ 5 ],
                    },
                ],
            },
            elseBlock: {
                nodeType: "block-statement",
                children: [
                    {
                        nodeType: "operation",
                        opcode: "int",
                        args: [ 6 ],
                    },   
                ],
            },
        };

        expect(generateCode(node)).toEqual([
            "int 4",
            "bz else_1",
            "int 5",
            "b end_1",
            "else_1:",
            "int 6",
            "end_1:",
        ]);
    });

    it("can generate code for if statement with no else block", () => {

        const node: ASTNode = {
            nodeType: "if-statement",
            children: [
                {
                    nodeType: "operation",
                    opcode: "int",
                    args: [ 4 ],
                },
            ],
            ifBlock: {
                nodeType: "block-statement",
                children: [
                    {
                        nodeType: "operation",
                        opcode: "int",
                        args: [ 5 ],
                    },
                ],
            },
        };

        expect(generateCode(node)).toEqual([
            "int 4",
            "bz else_1",
            "int 5",
            "b end_1",
            "else_1:",
            "end_1:",
        ]);
    });

    it("can generate code for while loop", () => {

        const ast: ASTNode = {
            nodeType: "while-statement",
            children: [
                {
                    nodeType: "operation",
                    opcode: "int",
                    args: [ 4 ],
                },
            ],
            body: {
                nodeType: "operation",
                opcode: "int",
                args: [ 5 ],
            },
        };

        expect(generateCode(ast)).toEqual([
            "loop_start_1:",
            "int 4",
            "bz loop_end_1",
            "int 5",
            "b loop_start_1",
            "loop_end_1:",            
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
                            nodeType: "operation",
                            opcode: "int",
                            args: [ 2 ],
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
            `callsub myFunction`,
        ]);
    });

    it("can call function with args", () => {

        const node: ASTNode = {
            nodeType: "function-call",
            name: "myFunction",
            children: [
                {
                    nodeType: "operation",
                    opcode: "int",
                    args: [ 1 ],
                },
                {
                    nodeType: "operation",
                    opcode: "int",
                    args: [ 2 ],
                },
            ],
        };

        expect(generateCode(node)).toEqual([
            `int 1`,
            `int 2`,
            `callsub myFunction`,
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
                        nodeType: "operation",
                        opcode: "int",
                        args: [ 1 ],
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
            "myFunction:",
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
                nodeType: "operation",
                opcode: "int",
                args: [ 1 ],
            },
        };

        expect(generateCode(node)).toEqual([
            "",
            "int 256",
            "store 0",
            "",
            "b program_end",
            "myFunction:",
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
            "store 0",
            "retsub",
            "",
            "program_end:"
        ]);
    });
});
