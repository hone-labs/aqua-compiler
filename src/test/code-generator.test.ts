import { ASTNode } from "../ast";
import { CodeEmitter } from "../code-emitter";
import { CodeGenerator, visitors } from "../code-generator";
import { IError } from "../error";
import { SymbolType } from "../symbol";
import { expectArray } from "./lib/utils";

describe("code generator", () => {

    //
    // Generates code from an AST.
    //
    function generateCode(ast: ASTNode) {
        let errors: IError[] = [];
        const codeEmitter = new CodeEmitter(false);
        const codeGenerator = new CodeGenerator(codeEmitter, err => { errors.push(err) });
        codeGenerator.generateCode(ast);
        const output = codeEmitter.getOutput();
        return { output, errors };
    }

    it("can generate code for children", () => {

        const ast = {
            nodeType: "operation",
            opcode: "op-parent",
            numItemsAdded: 1,
            numItemsRemoved: 2,
            children: [
                {
                    nodeType: "operation",
                    opcode: "op-child-1",
                    numItemsAdded: 1,
                    numItemsRemoved: 0,
                },
                {
                    nodeType: "operation",
                    opcode: "op-child-2",
                    numItemsAdded: 1,
                    numItemsRemoved: 0,
                },
            ],
        };

        const { output } = generateCode(ast);
        expect(output).toEqual([
            `op-child-1`,
            `op-child-2`,
            `op-parent`,
        ]);
    });

    it("can generate code for operation", () => {

        const ast = {
            nodeType: "operation",
            opcode: "op",
            numItemsAdded: 1,
            numItemsRemoved: 0,
        };

        const { output } = generateCode(ast);
        expect(output).toEqual([
            "op",
        ]);
    });

    it("can generate code for operation with arg", () => {

        const opcode = "test-opcode";
        const value = "1234";
        const ast = {
            nodeType: "operation",
            opcode: opcode,
            numItemsAdded: 1,
            numItemsRemoved: 0,
            args: [ value ],
        };

        const { output } = generateCode(ast);
        expect(output).toEqual([
            `${opcode} ${value}`,
        ]);
    });    

    it("can generate code for operation with multiple args", () => {

        const ast = {
            nodeType: "operation",
            opcode: "op",
            numItemsAdded: 1,
            numItemsRemoved: 0,
            args: [ 1, 2, 3 ],
        };

        const { output } = generateCode(ast);
        expect(output).toEqual([
            `op 1 2 3`,
        ]);
    });    

    it("can generate code for expression statement", () => {

        const ast = {
            nodeType: "expr-statement",
            children: [],
        };

        const { output } = generateCode(ast);
        expect(output).toEqual([]);
    });    

    it("pops stack for each child", () => {

        const ast = {
            nodeType: "expr-statement",
            children: [
                {
                    nodeType: "number",
                    value: 1,
                },
                {
                    nodeType: "number",
                    value: 2,
                },
            ],
        };

        const { output } = generateCode(ast);
        expect(output).toEqual([
            `int 1`,
            `int 2`,
            `pop`,
            `pop`,
        ]);
    });    

    it("can generate code for global return statement", () => {

        const ast = {
            nodeType: "return-statement",
            children: [
                {
                    nodeType: "number",
                    value: 1,
                },
            ],
        };

        const { output } = generateCode(ast);
        expect(output).toEqual([
            `int 1`,
            `return`,
        ]);
    });    

    it("can generate code for block", () => {

        const ast = {
            nodeType: "block-statement",
            children: [],
        };

        const { output } = generateCode(ast);
        expect(output).toEqual([]);
    });    

    it("can declare variable", () => {

        const ast = {
            nodeType: "declare-variable",
            value: "myVar",
        };

        const { output } = generateCode(ast);
        expect(output).toEqual([]); // Nothing generated for an uninitialised variable.
    });

    it("can declare variable with initialiser", () => {

        const assignee = {
            nodeType: "identifier",
            value: "myVar",
        };

        const symbol = {
            name: "myVar",
            type: SymbolType.Variable,
            position: 4,
            isGlobal: true,
        };

        const ast: ASTNode = {
            nodeType: "declare-variable",
            symbol: symbol,
            assignee: assignee,
            initializer: {
                nodeType: "assignment",
                symbol: symbol,
                assignee: assignee,
                children: [ 
                    {
                        nodeType: "number",
                        value: 3,
                    },
                ],
            },   
        };

        const { output } = generateCode(ast);
        expect(output).toEqual([
            `int 3`,
            `dup`,      //TODO: Converting "declarate-variable" to reuse "assignment" added extra instructions here.
            `store 4`,
            `pop`,
        ]);
    });

    it("can access variable", () => {

        const node: ASTNode = {
            nodeType: "identifier",
            value: "myVar",
            symbol: {
                name: "myVar",
                type: SymbolType.Variable,
                position: 2,
                isGlobal: true,
            },
        };

        const { output } = generateCode(node);
        expect(output).toEqual([
            `load 2`
        ]);
    });

    it("can generate code for if statement", () => {

        const node: ASTNode = {
            nodeType: "if-statement",
            children: [
                {
                    nodeType: "number",
                    value: 4,
                },
            ],
            ifBlock: {
                nodeType: "block-statement",
                children: [
                    {
                        nodeType: "number",
                        value: 5,
                    },
                ],
            },
            elseBlock: {
                nodeType: "block-statement",
                children: [
                    {
                        nodeType: "number",
                        value: 6,
                    },   
                ],
            },
        };

        const { output } = generateCode(node);
        expect(output).toEqual([
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
                    nodeType: "number",
                    value: 4,
                },
            ],
            ifBlock: {
                nodeType: "block-statement",
                children: [
                    {
                        nodeType: "number",
                        value: 5,
                    },
                ],
            },
        };

        const { output } = generateCode(node);
        expect(output).toEqual([
            "int 4",
            "bz else_1",
            "int 5",
            "b end_1",
            "else_1:",
            "end_1:",
        ]);
    });

    it("can generate code for nested if statement", () => {

        const node: ASTNode = {
            nodeType: "if-statement",                       // If stmt.
            children: [
                {
                    nodeType: "number",                  // Conditon.
                    value: 1,
                },
            ],
            ifBlock: {
                nodeType: "block-statement",
                children: [
                    {
                        nodeType: "if-statement",           // Nested if stmt.
                        children: [
                            {
                                nodeType: "number",      // Nested condition.
                                value: 2,
                            },
                        ],
                        ifBlock: {
                            nodeType: "block-statement",
                            children: [
                                {
                                    nodeType: "number",   // Nested body.
                                    value: 3,
                                },
                            ],
                        },
                    }
                ],
            },
        };

        const { output } = generateCode(node);
        expect(output).toEqual([
            "int 1",            // Condition.
            "bz else_1",        
                "int 2",        // Nested condition.
                "bz else_2",
                "int 3",        // Nested body.
                "b end_2",
                "else_2:",
                "end_2:",
            "b end_1",
            "else_1:",
            "end_1:"
        ]);
    });

    it("can generate code for while loop", () => {

        const ast: ASTNode = {
            nodeType: "while-statement",
            children: [
                {
                    nodeType: "number",
                    value: 4,
                },
            ],
            body: {
                nodeType: "number",
                value: 5,
            },
        };

        const { output } = generateCode(ast);
        expect(output).toEqual([
            "loop_start_1:",
            "int 4",
            "bz loop_end_1",
            "int 5",
            "b loop_start_1",
            "loop_end_1:",            
        ]);
    });

    it ("can generate code for nested while loop", () => {

        const ast: ASTNode = {                      // Loop.
            nodeType: "while-statement",
            children: [
                {
                    nodeType: "number",          // Condition.
                    value: 1,
                },
            ],
            body: {                                 // Nested loop.
                nodeType: "while-statement",        
                children: [
                    {
                        nodeType: "number",      // Nested condition.
                        value: 2,
                    },
                ],
                body: {                             // Nested body
                    nodeType: "number",
                    value: 3,
                },
            },
        };

        const { output } = generateCode(ast);
        expect(output).toEqual([
            "loop_start_1:",        // Loop.
            "int 1",                // Conditon.
            "bz loop_end_1",
                "loop_start_2:",    // Nested loop.
                "int 2",            // Nested condition.
                "bz loop_end_2",
                "int 3",            // Nested body.
                "b loop_start_2",
                "loop_end_2:",
            "b loop_start_1",
            "loop_end_1:"            
        ]);

    });

    it("can generate code for assignment to global variable", () => {
        const node: ASTNode = {
            nodeType: "block-statement",
            children: [
                {
                    nodeType: "declare-variable",
                    value: "myVar",
                },
                {
                    nodeType: "assignment",
                    symbol: {
                        name: "myVar",
                        type: SymbolType.Variable,
                        position: 3,
                        isGlobal: true,
                    },
                    children: [
                        {
                            nodeType: "number",
                            value: 2,
                        },
                    ],
                    assignee: {
                        nodeType: "identifier",
                        value: "myVar",
                    },
                },       
            ],
        };

        const { output } = generateCode(node);
        expect(output).toEqual([
            `int 2`,
            `dup`,
            `store 3`,
        ]);
    });

    it("can generate code for assignment to local variable", () => {
        const node: ASTNode = {
            nodeType: "block-statement",
            children: [
                {
                    nodeType: "declare-variable",
                    value: "myVar",
                },
                {
                    nodeType: "assignment",
                    symbol: {
                        name: "myVar",
                        type: SymbolType.Variable,
                        position: 3,
                        isGlobal: false,
                    },
                    children: [
                        {
                            nodeType: "number",
                            value: 2,
                        },
                    ],
                    assignee: {
                        nodeType: "identifier",
                        value: "myVar",
                    },
                },       
            ],
        };

        const { output } = generateCode(node);
        expect(output).toEqual([
            `int 2`,
            `int 3`,
            `load 0`,
            `+`,
            `dig 1`,
            `stores`,
        ]);
    });

    it("can call function with zero args", () => {

        const node: ASTNode = {
            nodeType: "function-call",
            value: "myFunction",
            symbol: {
                name: "myFunction",
                type: SymbolType.Function,
                returnType: { "type": "void" },
                isGlobal: true,
            },
            functionArgs: [],
        };

        const { output } = generateCode(node);
        expect(output).toEqual([
            `callsub myFunction`,
        ]);
    });

    it("can call function with args", () => {

        const node: ASTNode = {
            nodeType: "function-call",
            value: "myFunction",
            symbol: {
                name: "myFunction",
                type: SymbolType.Function,
                returnType: { "type": "void" },
                isGlobal: true,
            },
            functionArgs: [
                {
                    nodeType: "number",
                    value: 1,
                },
                {
                    nodeType: "number",
                    value: 2,
                },
            ],
        };

        const { output } = generateCode(node);
        expect(output).toEqual([
            `int 1`,
            `int 2`,
            `callsub myFunction`,
        ]);
    });

    it("can call function with uint64 return value", () => {
        const node: ASTNode = {
            nodeType: "expr-statement",
            children: [
                {
                    nodeType: "function-call",
                    value: "myFunction",
                    symbol: {
                        name: "myFunction",
                        type: SymbolType.Function,
                        returnType: { "type": "uint64" },
                        isGlobal: true,
                    },
                },
            ],
        };

        const { output } = generateCode(node);
        expect(output).toEqual([
            `callsub myFunction`,
            `pop`, // Pops the return value of the function.
        ]);
    });

    it("can call function with byte[] return value", () => {
        const node: ASTNode = {
            nodeType: "expr-statement",
            children: [
                {
                    nodeType: "function-call",
                    value: "myFunction",
                    symbol: {
                        name: "myFunction",
                        type: SymbolType.Function,
                        returnType: { "type": "byte[]" },
                        isGlobal: true,
                    },
                },
            ],
        };

        const { output } = generateCode(node);
        expect(output).toEqual([
            `callsub myFunction`,
            `pop`, // Pops the return value of the function.
        ]);
    });

    it("can call function with tuple return value", () => {
        const node: ASTNode = {
            nodeType: "expr-statement",
            children: [
                {
                    nodeType: "function-call",
                    value: "myFunction",
                    symbol: {
                        name: "myFunction",
                        type: SymbolType.Function,
                        returnType: { 
                            "type": "tuple",
                            "children": [
                                { type: "uint64" },
                                { type: "byte[]" },
                            ]
                        },
                        isGlobal: true,
                    },
                },
            ],
        };

        const { output } = generateCode(node);
        expect(output).toEqual([
            `callsub myFunction`,
            `pop`,  // Pops first item of tuple.
            `pop`,  // Pops second item of tuple.
        ]);
    });

    it("can call function with void return value", () => {
        const node: ASTNode = {
            nodeType: "expr-statement",
            children: [
                {
                    nodeType: "function-call",
                    value: "myFunction",
                    symbol: {
                        name: "myFunction",
                        type: SymbolType.Function,
                        returnType: { "type": "void" },
                        isGlobal: true,
                    },
                },
            ],
        };

        const { output } = generateCode(node);
        expect(output).toEqual([
            `callsub myFunction`,
            // Does not pop the return value of the function.
        ]);
    });

    it("can declare a function", () => {
        const ast: any = {
            nodeType: "function-declaration",
            value: "myFunction",
            params: [],
            scope: {
                getNumSymbols: () => 0,
            },
            body: {
                nodeType: "return-statement",
                children: [
                    {
                        nodeType: "number",
                        value: 1,
                    },        
                ],
            },
        };

        const { output } = generateCode(ast);
        expect(output).toEqual([
            "",
            "int 255",
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
            "b myFunction-cleanup",
            "myFunction-cleanup:",
            "load 0",
            "loads",
            "store 0",
            "retsub",
            "",
            "program_end:",
        ]);
    });

    it("function return is synthesized when not explicit", () => {
        const node: any = {
            nodeType: "function-declaration",
            value: "myFunction",
            params: [],
            scope: {
                getNumSymbols: () => 0,
            },
            body: {
                nodeType: "number",
                value: 1,
            },
        };

        const { output } = generateCode(node);
        expect(output).toEqual([
            "",
            "int 255",
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
            "myFunction-cleanup:",
            "load 0",
            "loads",
            "store 0",
            "retsub",
            "",
            "program_end:"
        ]);
    });

    it("code generation reports an error when visitor throws", () => {

        const nodeType = "bad-node";
        const ast: ASTNode = {
            nodeType,
        };

        const errMsg = "This node is bad!";
        visitors[nodeType] = () => {
            throw new Error(errMsg)
        };

        const { errors } = generateCode(ast);

        expectArray(errors, [
            {
                message: errMsg,
            }
        ]);
    });

});
