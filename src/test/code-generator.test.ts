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
            numItemsAdded: 1,
            numItemsRemoved: 0,
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
            numItemsAdded: 1,
            numItemsRemoved: 0,
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
            numItemsAdded: 1,
            numItemsRemoved: 0,
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

    it("pops stack for each child", () => {

        const node = {
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

        expect(generateCode(node)).toEqual([
            `int 1`,
            `int 2`,
            `pop`,
            `pop`,
        ]);
    });    

    it("can generate code for global return statement", () => {

        const node = {
            nodeType: "return-statement",
            children: [
                {
                    nodeType: "number",
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

        const assignee = {
            nodeType: "access-variable",
            name: "myVar",
        };

        const symbol = {
            name: "myVar",
            type: SymbolType.Variable,
            position: 4,
            isGlobal: true,
        };

        const node: ASTNode = {
            nodeType: "declare-variable",
            symbol: symbol,
            assignee: assignee,
            initializer: {
                nodeType: "assignment-statement",
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

        expect(generateCode(node)).toEqual([
            `int 3`,
            `dup`,      //TODO: Converting "declarate-variable" to reuse "assignment-statement" added extra instructions here.
            `store 4`,
            `pop`,
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

        expect(generateCode(node)).toEqual([
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

        expect(generateCode(node)).toEqual([
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

        expect(generateCode(ast)).toEqual([
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

        expect(generateCode(ast)).toEqual([
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
                            nodeType: "number",
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
                    name: "myVar",
                },
                {
                    nodeType: "assignment-statement",
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
                        nodeType: "access-variable",
                        name: "myVar",
                    },
                },       
            ],
        };

        expect(generateCode(node)).toEqual([
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
            name: "myFunction",
            functionArgs: [],
        };

        expect(generateCode(node)).toEqual([
            `callsub myFunction`,
        ]);
    });

    it("can call function with args", () => {

        const node: ASTNode = {
            nodeType: "function-call",
            name: "myFunction",
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
                        nodeType: "number",
                        value: 1,
                    },        
                ],
            },
        };

        expect(generateCode(ast)).toEqual([
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
            name: "myFunction",
            params: [],
            scope: {
                getNumSymbols: () => 0,
            },
            body: {
                nodeType: "number",
                value: 1,
            },
        };

        expect(generateCode(node)).toEqual([
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
});
