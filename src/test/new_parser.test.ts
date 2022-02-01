import { ASTNode } from "../ast";
import { parse, parseExpression } from "../new_parser";
import { IError } from "../tokenizer";

describe("parser", () => {

    //
    // Parse code and return the AST.
    // Expects that no errors occurred.
    //
    function parseOk(code: string): ASTNode {
        let errors: IError[] = [];

        const ast = parse(code, err => {
            errors.push(err);
        });

        if (errors.length > 0) {
            throw new Error(`Got errors during parsing:\n${errors.map(err => err.msg).join('\n')}`);
        }

        return ast;
    }

    //
    // Parse code and return the AST.
    // Expects that no errors occurred.
    //
    function parseExpressionOk(code: string): ASTNode {
        let errors: IError[] = [];

        const ast = parseExpression(code, err => {
            errors.push(err);
        });

        if (errors.length > 0) {
            throw new Error(`Got errors during parsing:\n${errors.map(err => err.msg).join('\n')}`);
        }

        return ast;
    }

    //
    // Parses code and only returns the errors produced.
    //
    function retreiveErrors(code: string): IError[] {
        let errors: IError[] = [];

        parse(code, err => {
            errors.push(err);
        });

        return errors;
    }

    //
    // Expect a single object to contain expected fields.
    //
    function expectFields(actual: any, expected: any): void {
        for (const [key, value] of Object.entries(expected)) {
            const actualValue = actual[key];
            const expectedValue = expected[key];
            if (actualValue !== expectedValue) {
                throw new Error(`Expected "${key}" to be set to ${value}\r\nActual value: ${actualValue}\r\nExpected value: ${expectedValue}\r\nActual object: ${JSON.stringify(actual, null, 4)}`);
            }
        }
    }

    //
    // Expect an array of object to contain expected fields.
    //
    function expectArray(actual: any[], expected: any[]): void {

        expect(actual.length).toEqual(expected.length);

        for (let i = 0; i < actual.length; ++i) {
            expectFields(actual[i], expected[i]);
        }
    }

    test("can parse number expression", () => {

        expect(parseExpressionOk("12")).toEqual({
            nodeType: "operation",
            opcode: "int",
            type: "integer",
            args: [
                12
            ],
        });
    });

    test("can parse addition expression", () => {

        expect(parseExpressionOk("1+2")).toEqual({
            nodeType: "operation",
            opcode: "+",
            type: "integer",
            children: [
                {
                    nodeType: "operation",
                    opcode: "int",
                    type: "integer",
                    args: [
                        1
                    ],
                },
                {
                    nodeType: "operation",
                    opcode: "int",
                    type: "integer",
                    args: [
                        2
                    ],
                }
            ],
        });
    });

    test("can parse continued addition expression", () => {

        expect(parseExpressionOk("1+2+3")).toEqual({
            "nodeType": "operation",
            "opcode": "+",
            "type": "integer",
            "children": [
                {
                    "nodeType": "operation",
                    "opcode": "+",
                    "type": "integer",
                    "children": [
                        {
                            "nodeType": "operation",
                            "opcode": "int",
                            "type": "integer",
                            "args": [
                                1
                            ]
                        },
                        {
                            "nodeType": "operation",
                            "opcode": "int",
                            "type": "integer",
                            "args": [
                                2
                            ]
                        }
                    ]
                },
                {
                    "nodeType": "operation",
                    "opcode": "int",
                    "type": "integer",
                    "args": [
                        3
                    ]
                }
            ]
        });
    });

    test("can parse subtraction expression", () => {

        expect(parseExpressionOk("1-2")).toEqual({
            nodeType: "operation",
            opcode: "-",
            type: "integer",
            children: [
                {
                    nodeType: "operation",
                    opcode: "int",
                    type: "integer",
                    args: [
                        1
                    ],
                },
                {
                    nodeType: "operation",
                    opcode: "int",
                    type: "integer",
                    args: [
                        2
                    ],
                }
            ],
        });
    });

    test("can parse continued subtraction expression", () => {

        const ast = parseExpressionOk("1-2-3");
        expect(ast).toEqual({
            "nodeType": "operation",
            "opcode": "-",
            "type": "integer",
            "children": [
                {
                    "nodeType": "operation",
                    "opcode": "-",
                    "type": "integer",
                    "children": [
                        {
                            "nodeType": "operation",
                            "opcode": "int",
                            "type": "integer",
                            "args": [
                                1
                            ]
                        },
                        {
                            "nodeType": "operation",
                            "opcode": "int",
                            "type": "integer",
                            "args": [
                                2
                            ]
                        }
                    ]
                },
                {
                    "nodeType": "operation",
                    "opcode": "int",
                    "type": "integer",
                    "args": [
                        3
                    ]
                }
            ]
        });
    });

    test("can parse expression statement", () => {

        expect(parseOk("1;")).toEqual({
            nodeType: "block-statment",
            children: [
                {
                    nodeType: "expr-statement",
                    children: [
                        {
                            nodeType: "operation",
                            opcode: "int",
                            type: "integer",
                            args: [
                                1
                            ]
                        }
                    ]
                }
            ]
        });

    });

    test("missing semicolon triggers an error", () => {

        let errorReported = false;
        const ast = parse("1", () => {
            errorReported = true;
        });
        expect(errorReported).toEqual(true);
    });

    test("erroneous statement is omitted", () => {

        const ast = parse("1");
        expect(ast).toEqual({
            nodeType: "block-statment",
            children: [] // No children, the broken statement is omitted.
        });
    });

    test("bad token triggers an error", () => {

        let errorReported = false;
        const ast = parse("@;", () => {
            errorReported = true;
        });
        expect(errorReported).toEqual(true);
    });

    test("error for unexpected character", () => {
        expectArray(retreiveErrors("@"), [{ msg: 'Encountered unexpected character "@"' }]);
    });

    test("error unexpected token", () => {
        expectArray(retreiveErrors("="), [{ msg: 'Unexpected token "="' }]);
    });

    test("error reports line and column", () => {

        expectArray(retreiveErrors("@"), [{ line: 1, column: 0 }]);
        expectArray(retreiveErrors("\n@"), [{ line: 2, column: 0 }]);
        expectArray(retreiveErrors(" @"), [{ line: 1, column: 1 }]);
        expectArray(retreiveErrors("\n @"), [{ line: 2, column: 1 }]);
    });

    test("can parse multiple statments", () => {

        const ast = parseOk("1;\n2;");
        expect(ast).toEqual({
            "nodeType": "block-statment",
            "children": [
                {
                    "nodeType": "expr-statement",
                    "children": [
                        {
                            "nodeType": "operation",
                            "opcode": "int",
                            "type": "integer",
                            "args": [
                                1
                            ]
                        }
                    ]
                },
                {
                    "nodeType": "expr-statement",
                    "children": [
                        {
                            "nodeType": "operation",
                            "opcode": "int",
                            "type": "integer",
                            "args": [
                                2
                            ]
                        }
                    ]
                }
            ]
        });
    });

    test("error causes resync to next statement", () => {

        const ast = parse("=;2;");
        expect(ast).toEqual({
            "nodeType": "block-statment",
            "children": [
                {
                    "nodeType": "expr-statement",
                    "children": [
                        {
                            "nodeType": "operation",
                            "opcode": "int",
                            "type": "integer",
                            "args": [
                                2
                            ]
                        }
                    ]
                }
            ]
        });
    });

    test("can declare a constant", () => {

        const ast = parseOk("const a = 3;");
        expect(ast).toEqual({
            "nodeType": "block-statment",
            "children": [
                {
                    "nodeType": "declare-variable",
                    "name": "a",
                    "symbolType": 1,
                    "children": [
                        {
                            "nodeType": "operation",
                            "opcode": "int",
                            "type": "integer",
                            "args": [
                                3
                            ]
                        }
                    ]
                }
            ]
        });
    });

    test("can declare a variable", () => {

        const ast = parseOk("let a = 3;");
        expect(ast).toEqual({
            "nodeType": "block-statment",
            "children": [
                {
                    "nodeType": "declare-variable",
                    "name": "a",
                    "symbolType": 0,
                    "children": [
                        {
                            "nodeType": "operation",
                            "opcode": "int",
                            "type": "integer",
                            "args": [
                                3
                            ]
                        }
                    ]
                }
            ]
        });
    });

    test("can parse an empty block statement", () => {

        const ast = parseOk("{}");
        expect(ast).toEqual({
            "nodeType": "block-statment", // Program level.
            "children": [
                {
                    "nodeType": "block-statment",
                    "children": [
                    ]
                }
            ]
        });
    });

    test("can parse block statement with sub-statement", () => {

        const ast = parseOk("{\n1;\n}");
        expect(ast).toEqual({
            "nodeType": "block-statment", // Program level.
            "children": [
                {
                    "nodeType": "block-statment",
                    "children": [
                        {
                            "nodeType": "expr-statement",
                            "children": [
                                {
                                    "nodeType": "operation",
                                    "opcode": "int",
                                    "type": "integer",
                                    "args": [
                                        1
                                    ]
                                }
                            ]
                        }
                    ]
                }
            ]
        });
    });

    test("can parse a nested block statement", () => {

        const ast = parseOk("{\n{\n}\n}");
        expect(ast).toEqual({
            "nodeType": "block-statment", // Program level.
            "children": [
                {
                    "nodeType": "block-statment",
                    "children": [
                        {
                            "nodeType": "block-statment",
                            "children": []
                        }
                    ]
                }
            ]
        });
    });

    test("can declare a function", () => {

        const ast = parseOk("function test () {\n}");
        expect(ast).toEqual({
            "nodeType": "block-statment",
            "children": [
                {
                    "nodeType": "function-declaration",
                    "name": "test",
                    "params": [],
                    "body": {
                        "nodeType": "block-statment",
                        "children": []
                    }
                }
            ]
        });
    });

    test("can declare a function with parameters", () => {

        const ast = parseOk("function test( a, b, c ) {}");
        expect(ast).toEqual({
            "nodeType": "block-statment",
            "children": [
                {
                    "nodeType": "function-declaration",
                    "name": "test",
                    "params": ["a", "b", "c"],
                    "body": {
                        "nodeType": "block-statment",
                        "children": []
                    }
                }
            ]
        });
    });

    test("a function can contain statements", () => {

        const ast = parseOk("function test () {\n1;\n}");
        expect(ast).toEqual({
            "nodeType": "block-statment",
            "children": [
                {
                    "nodeType": "function-declaration",
                    "name": "test",
                    "params": [],
                    "body": {
                        "nodeType": "block-statment",
                        "children": [
                            {
                                "nodeType": "expr-statement",
                                "children": [
                                    {
                                        "nodeType": "operation",
                                        "opcode": "int",
                                        "type": "integer",
                                        "args": [
                                            1
                                        ]
                                    }
                                ]
                            }
                        ]
                    }
                }
            ]
        });
    });

    test("can parse empty statement", () => {
        const ast = parseOk(";");
        expect(ast).toEqual({
            "nodeType": "block-statment", // Program level.
            "children": [
                {
                    "nodeType": "block-statment", // Empty statement.
                    "children": []
                }
            ]
        });
    });

    it("can parse a return statement", () => {

        const ast = parseOk("return 1;");
        expect(ast).toEqual({
            "nodeType": "block-statment",
            "children": [
                {
                    "nodeType": "return-statement",
                    "children": [
                        {
                            "nodeType": "operation",
                            "opcode": "int",
                            "type": "integer",
                            "args": [
                                1
                            ]
                        }
                    ]
                }
            ]
        });
    });

    it("can parse variable access", () => {

        const ast = parseExpressionOk("foo");
        expect(ast).toEqual({
            "nodeType": "access-variable",
            "name": "foo"
        });
    });

    it("can parse function call", () => {

        const ast = parseExpressionOk("foo()");
        expect(ast).toEqual({
            "nodeType": "function-call",
            "name": "foo",
            "children": []
        });

    });



});