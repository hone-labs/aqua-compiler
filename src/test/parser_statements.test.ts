import { ASTNode } from "../ast";
import { parse } from "../parser";
import { SymbolType } from "../symbol-table";
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

    test("can parse expression statement", () => {

        expect(parseOk("1;")).toEqual({
            nodeType: "block-statement",
            children: [
                {
                    nodeType: "expr-statement",
                    children: [
                        {
                            nodeType: "number",
                            value: 1,
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

        const ast = parse("1", () => {});
        expect(ast).toEqual({
            nodeType: "block-statement",
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

    test("can parse multiple statements", () => {

        const ast = parseOk("1;\n2;");
        expect(ast).toEqual({
            "nodeType": "block-statement",
            "children": [
                {
                    "nodeType": "expr-statement",
                    "children": [
                        {
                            "nodeType": "number",
                            "value": 1,
                        }
                    ]
                },
                {
                    "nodeType": "expr-statement",
                    "children": [
                        {
                            "nodeType": "number",
                            "value": 2,
                        }
                    ]
                }
            ]
        });
    });

    test("error causes resync to next statement", () => {

        const ast = parse("=;2;", () => {});
        expect(ast).toEqual({
            "nodeType": "block-statement",
            "children": [
                {
                    "nodeType": "expr-statement",
                    "children": [
                        {
                            "nodeType": "number",
                            "value": 2,
                        }
                    ]
                }
            ]
        });
    });

    test("can declare a constant", () => {

        const ast = parseOk("const a = 3;");
        expect(ast).toEqual({
            "nodeType": "block-statement",
            "children": [
                {
                    "nodeType": "declare-variable",
                    "assignee": {
                        "nodeType": "identifier",
                        "value": "a",
                    },
                    "symbolType": 1,
                    "initializer": {
                        "nodeType": "assignment",
                        "checkConstantAssignment": false,
                        "assignee": {
                            "nodeType": "identifier",
                            "value": "a",
                        },
                        "children": [
                            {
                                "nodeType": "number",
                                "value": 3,
                            }
                        ]
                    }
                }
            ]
        });
    });

    test("can declare a variable", () => {

        const ast = parseOk("let a = 3;");
        expect(ast).toEqual({
            "nodeType": "block-statement",
            "children": [
                {
                    "nodeType": "declare-variable",
                    "assignee": {
                        "nodeType": "identifier",
                        "value": "a",
                    },
                    "symbolType": 0,
                    "initializer": {
                        "nodeType": "assignment",
                        "checkConstantAssignment": false,
                        "assignee": {
                            "nodeType": "identifier",
                            "value": "a",
                        },
                        "children": [
                            {
                                "nodeType": "number",
                                "value": 3,
                            }
                        ]
                    }
                }
            ]
        });
    });

    test("can declare an uninitialised tuple", () => {

        const ast = parseOk("let (a, b);");
        expect(ast).toEqual({
            "nodeType": "block-statement",
            "children": [
                {
                    "nodeType": "declare-variable",
                    "assignee": {
                        "nodeType": "tuple",
                        "children": [
                            {
                                "nodeType": "identifier",
                                "value": "a"
                            },
                            {
                                "nodeType": "identifier",
                                "value": "b"
                            }
                        ]
                    },
                    "symbolType": SymbolType.Variable
                }
            ]
        });
    });

    test("can declare an initialised tuple", () => {

        const ast = parseOk("let (a, b) = (1, 2);");
        expect(ast).toEqual({
            "nodeType": "block-statement",
            "children": [
                {
                    "nodeType": "declare-variable",
                    "assignee": {
                        "nodeType": "tuple",
                        "children": [
                            {
                                "nodeType": "identifier",
                                "value": "a"
                            },
                            {
                                "nodeType": "identifier",
                                "value": "b"
                            }
                        ]
                    },
                    "symbolType": 0,
                    "initializer": {
                        "nodeType": "assignment",
                        "assignee": {
                            "nodeType": "tuple",
                            "children": [
                                {
                                    "nodeType": "identifier",
                                    "value": "a"
                                },
                                {
                                    "nodeType": "identifier",
                                    "value": "b"
                                }
                            ]
                        },
                        "checkConstantAssignment": false,
                        "children": [
                            {
                                "nodeType": "tuple",
                                "children": [
                                    {
                                        "nodeType": "number",
                                        "value": 1
                                    },
                                    {
                                        "nodeType": "number",
                                        "value": 2
                                    }
                                ]
                            }
                        ]
                    }
                }
            ]
        });
    });

    test("can declare a constant tuple", () => {

        const ast = parseOk("const (a, b) = (1, 2);");
        expect(ast).toEqual({
            "nodeType": "block-statement",
            "children": [
                {
                    "nodeType": "declare-variable",
                    "assignee": {
                        "nodeType": "tuple",
                        "children": [
                            {
                                "nodeType": "identifier",
                                "value": "a"
                            },
                            {
                                "nodeType": "identifier",
                                "value": "b"
                            }
                        ]
                    },
                    "symbolType": 1,
                    "initializer": {
                        "nodeType": "assignment",
                        "assignee": {
                            "nodeType": "tuple",
                            "children": [
                                {
                                    "nodeType": "identifier",
                                    "value": "a"
                                },
                                {
                                    "nodeType": "identifier",
                                    "value": "b"
                                }
                            ]
                        },
                        "checkConstantAssignment": false,
                        "children": [
                            {
                                "nodeType": "tuple",
                                "children": [
                                    {
                                        "nodeType": "number",
                                        "value": 1
                                    },
                                    {
                                        "nodeType": "number",
                                        "value": 2
                                    }
                                ]
                            }
                        ]
                    }
                }
            ]
        });
    });

    test("can parse an empty block statement", () => {

        const ast = parseOk("{}");
        expect(ast).toEqual({
            "nodeType": "block-statement", // Program level.
            "children": [
                {
                    "nodeType": "block-statement",
                    "children": [
                    ]
                }
            ]
        });
    });

    test("can parse block statement with sub-statement", () => {

        const ast = parseOk("{\n1;\n}");
        expect(ast).toEqual({
            "nodeType": "block-statement", // Program level.
            "children": [
                {
                    "nodeType": "block-statement",
                    "children": [
                        {
                            "nodeType": "expr-statement",
                            "children": [
                                {
                                    "nodeType": "number",
                                    "value": 1,
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
            "nodeType": "block-statement", // Program level.
            "children": [
                {
                    "nodeType": "block-statement",
                    "children": [
                        {
                            "nodeType": "block-statement",
                            "children": []
                        }
                    ]
                }
            ]
        });
    });

    test("can declare a function with no return value", () => {

        const ast = parseOk("function test (): void {\n}");
        expect(ast).toEqual({
            "nodeType": "block-statement",
            "children": [
                {
                    "nodeType": "function-declaration",
                    "value": "test",
                    "params": [],
                    "returnType": "void",
                    "body": {
                        "nodeType": "block-statement",
                        "children": []
                    }
                }
            ]
        });
    });

    test("can declare a function with an integer return value", () => {

        const ast = parseOk("function test (): uint64 {\n}");
        expect(ast).toEqual({
            "nodeType": "block-statement",
            "children": [
                {
                    "nodeType": "function-declaration",
                    "value": "test",
                    "params": [],
                    "returnType": "uint64",
                    "body": {
                        "nodeType": "block-statement",
                        "children": []
                    }
                }
            ]
        });
    });

    test("can declare a function with a byte array return value", () => {

        const ast = parseOk("function test (): byte[] {\n}");
        expect(ast).toEqual({
            "nodeType": "block-statement",
            "children": [
                {
                    "nodeType": "function-declaration",
                    "value": "test",
                    "params": [],
                    "returnType": "byte[]",
                    "body": {
                        "nodeType": "block-statement",
                        "children": []
                    }
                }
            ]
        });
    });

    test("can declare a function with parameters", () => {

        const ast = parseOk("function test( a, b, c ): void {}");
        expect(ast).toEqual({
            "nodeType": "block-statement",
            "children": [
                {
                    "nodeType": "function-declaration",
                    "value": "test",
                    "params": ["a", "b", "c"],
                    "returnType": "void",
                    "body": {
                        "nodeType": "block-statement",
                        "children": []
                    }
                }
            ]
        });
    });

    test("a function can contain statements", () => {

        const ast = parseOk("function test (): void {\n1;\n}");
        expect(ast).toEqual({
            "nodeType": "block-statement",
            "children": [
                {
                    "nodeType": "function-declaration",
                    "value": "test",
                    "params": [],
                    "returnType": "void",
                    "body": {
                        "nodeType": "block-statement",
                        "children": [
                            {
                                "nodeType": "expr-statement",
                                "children": [
                                    {
                                        "nodeType": "number",
                                        "value": 1,
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
            "nodeType": "block-statement", // Program level.
            "children": [
                {
                    "nodeType": "block-statement", // Empty statement.
                    "children": []
                }
            ]
        });
    });

    test("can parse a return statement", () => {

        const ast = parseOk("return 1;");
        expect(ast).toEqual({
            "nodeType": "block-statement",
            "children": [
                {
                    "nodeType": "return-statement",
                    "children": [
                        {
                            "nodeType": "number",
                            "value": 1,
                        }
                    ]
                }
            ]
        });
    });

    test("can parse if statement", () => {

        const ast = parseOk("if (1) {\n2;\n}");
        expect(ast).toEqual({
            "nodeType": "block-statement",
            "children": [
                {
                    "nodeType": "if-statement",
                    "children": [
                        {
                            "nodeType": "number",
                            "value": 1,
                        }
                    ],
                    "ifBlock": {
                        "nodeType": "block-statement",
                        "children": [
                            {
                                "nodeType": "expr-statement",
                                "children": [
                                    {
                                        "nodeType": "number",
                                        "value": 2,
                                    }
                                ]
                            }
                        ]
                    }
                }
            ]
        });

    });

    test("can parse if with single statement", () => {

        const ast = parseOk("if (1)\n2;");
        expect(ast).toEqual({
            "nodeType": "block-statement",
            "children": [
                {
                    "nodeType": "if-statement",
                    "children": [
                        {
                            "nodeType": "number",
                            "value": 1,
                        }
                    ],
                    "ifBlock": {
                        "nodeType": "expr-statement",
                        "children": [
                            {
                                "nodeType": "number",
                                "value": 2,
                            }
                        ]
                    }
                }
            ]
        });

    });

    test("can parse if-else statement", () => {

        const ast = parseOk("if (1) {\n2;\n}\nelse {\n 3;\n}");
        expect(ast).toEqual({
            "nodeType": "block-statement",
            "children": [
                {
                    "nodeType": "if-statement",
                    "children": [
                        {
                            "nodeType": "number",
                            "value": 1,
                        }
                    ],
                    "ifBlock": {
                        "nodeType": "block-statement",
                        "children": [
                            {
                                "nodeType": "expr-statement",
                                "children": [
                                    {
                                        "nodeType": "number",
                                        "value": 2,
                                    }
                                ]
                            }
                        ]
                    },
                    "elseBlock": {
                        "nodeType": "block-statement",
                        "children": [
                            {
                                "nodeType": "expr-statement",
                                "children": [
                                    {
                                        "nodeType": "number",
                                        "value": 3,
                                    }
                                ]
                            }
                        ]
                    }
                }
            ]
        });
    });

    test("can parse if-else with single statements", () => {

        const ast = parseOk("if (1)\n2;\nelse\n 3;");
        expect(ast).toEqual({
            "nodeType": "block-statement",
            "children": [
                {
                    "nodeType": "if-statement",
                    "children": [
                        {
                            "nodeType": "number",
                            "value": 1,
                        }
                    ],
                    "ifBlock": {
                        "nodeType": "expr-statement",
                        "children": [
                            {
                                "nodeType": "number",
                                "value": 2,
                            }
                        ]
                    },
                    "elseBlock": {
                        "nodeType": "expr-statement",
                        "children": [
                            {
                                "nodeType": "number",
                                "value": 3,
                            }
                        ]
                    }
                }
            ]
        });

    });

    test("can parse if-else with single statements", () => {

        const ast = parseOk("if (1) {\n2;\n}\nelse if (3) {\n4;\n}");
        expect(ast).toEqual({
            "nodeType": "block-statement",
            "children": [
                {
                    "nodeType": "if-statement",
                    "children": [
                        {
                            "nodeType": "number",
                            "value": 1,
                        }
                    ],
                    "ifBlock": {
                        "nodeType": "block-statement",
                        "children": [
                            {
                                "nodeType": "expr-statement",
                                "children": [
                                    {
                                        "nodeType": "number",
                                        "value": 2,
                                    }
                                ]
                            }
                        ]
                    },
                    "elseBlock": {
                        "nodeType": "if-statement",
                        "children": [
                            {
                                "nodeType": "number",
                                "value": 3,
                            }
                        ],
                        "ifBlock": {
                            "nodeType": "block-statement",
                            "children": [
                                {
                                    "nodeType": "expr-statement",
                                    "children": [
                                        {
                                            "nodeType": "number",
                                            "value": 4,
                                        }
                                    ]
                                }
                            ]
                        }
                    }
                }
            ]
        });
    });

    test("can parse while statement", () => {

        const ast = parseOk("while (1) {\n2;\n}");
        expect(ast).toEqual({
            "nodeType": "block-statement",
            "children": [
                {
                    "nodeType": "while-statement",
                    "children": [
                        {
                            "nodeType": "number",
                            "value": 1,
                        }
                    ],
                    "body": {
                        "nodeType": "block-statement",
                        "children": [
                            {
                                "nodeType": "expr-statement",
                                "children": [
                                    {
                                        "nodeType": "number",
                                        "value": 2,
                                    }
                                ]
                            }
                        ]
                    }
                }
            ]
        });
    });

    test("can parse while with single statement", () => {

        const ast = parseOk("while (1)\n2;");
        expect(ast).toEqual({
            "nodeType": "block-statement",
            "children": [
                {
                    "nodeType": "while-statement",
                    "children": [
                        {
                            "nodeType": "number",
                            "value": 1,
                        }
                    ],
                    "body": {
                        "nodeType": "expr-statement",
                        "children": [
                            {
                                "nodeType": "number",
                                "value": 2,
                            }
                        ]
                    }
                }
            ]
        });
    });

    test("can parse for statement", () => {

        const ast = parseOk("for (1; 2; 3)\n{\n4;\n}");
        expect(ast).toEqual({
            "nodeType": "block-statement",
            "children": [
                {
                    "nodeType": "block-statement",
                    "children": [
                        {
                            "nodeType": "expr-statement",
                            "children": [
                                {
                                    "nodeType": "number",
                                    "value": 1,
                                }
                            ]
                        },
                        {
                            "nodeType": "while-statement",
                            "children": [
                                {
                                    "nodeType": "number",
                                    "value": 2,
                                }
                            ],
                            "body": {
                                "nodeType": "block-statement",
                                "children": [
                                    {
                                        "nodeType": "block-statement",
                                        "children": [
                                            {
                                                "nodeType": "expr-statement",
                                                "children": [
                                                    {
                                                        "nodeType": "number",
                                                        "value": 4,
                                                    }
                                                ]
                                            }
                                        ]
                                    },
                                    {
                                        "nodeType": "expr-statement",
                                        "children": [
                                            {
                                                "nodeType": "number",
                                                "value": 3,
                                            }
                                        ]
                                    }
                                ]
                            }
                        }
                    ]
                }
            ]
        });
    });

    test("can parse for statement without expressions", () => {

        const ast = parseOk("for (;;)\n{\n4;\n}");
        expect(ast).toEqual({
            "nodeType": "block-statement",
            "children": [
                {
                    "nodeType": "block-statement",
                    "children": [
                        {
                            "nodeType": "block-statement",
                            "children": []
                        },
                        {
                            "nodeType": "while-statement",
                            "children": [],
                            "body": {
                                "nodeType": "block-statement",
                                "children": [
                                    {
                                        "nodeType": "block-statement",
                                        "children": [
                                            {
                                                "nodeType": "expr-statement",
                                                "children": [
                                                    {
                                                        "nodeType": "number",
                                                        "value": 4,
                                                    }
                                                ]
                                            }
                                        ]
                                    },
                                    {
                                        "nodeType": "block-statement",
                                        "children": []
                                    }
                                ]
                            }
                        }
                    ]
                }
            ]
        });
    });

    test("can parse for with a single statement", () => {

        const ast = parseOk("for (;;)\n4;");
        expect(ast).toEqual({
            "nodeType": "block-statement",
            "children": [
                {
                    "nodeType": "block-statement",
                    "children": [
                        {
                            "nodeType": "block-statement",
                            "children": []
                        },
                        {
                            "nodeType": "while-statement",
                            "children": [],
                            "body": {
                                "nodeType": "block-statement",
                                "children": [
                                    {
                                        "nodeType": "expr-statement",
                                        "children": [
                                            {
                                                "nodeType": "number",
                                                "value": 4,
                                            }
                                        ]
                                    },
                                    {
                                        "nodeType": "block-statement",
                                        "children": []
                                    }
                                ]
                            }
                        }
                    ]
                }
            ]
        });
    });

    test("can parse for loop with variable declaration", () => {

        const ast = parseOk("for (let x = 3;;)\n{\n}");
        expect(ast).toEqual({
            "nodeType": "block-statement",
            "children": [
                {
                    "nodeType": "block-statement",
                    "children": [
                        {
                            "nodeType": "declare-variable",
                            "assignee": {
                                "nodeType": "identifier",
                                "value": "x",
                            },
                            "symbolType": 0,
                            "initializer": {
                                "nodeType": "assignment",
                                "checkConstantAssignment": false,
                                "assignee": {
                                    "nodeType": "identifier",
                                    "value": "x",
                                },
                                "children": [
                                    {
                                        "nodeType": "number",
                                        "value": 3,
                                    }
                                ]
                            }
                        },
                        {
                            "nodeType": "while-statement",
                            "children": [],
                            "body": {
                                "nodeType": "block-statement",
                                "children": [
                                    {
                                        "nodeType": "block-statement",
                                        "children": []
                                    },
                                    {
                                        "nodeType": "block-statement",
                                        "children": []
                                    }
                                ]
                            }
                        }
                    ]
                }
            ]
        });
    });

    test("can parse for loop with constant declaration", () => {

        const ast = parseOk("for (const x = 3;;)\n{\n}");
        expect(ast).toEqual({
            "nodeType": "block-statement",
            "children": [
                {
                    "nodeType": "block-statement",
                    "children": [
                        {
                            "nodeType": "declare-variable",
                            "assignee": {
                                "nodeType": "identifier",
                                "value": "x",
                            },
                            "symbolType": 1,
                            "initializer": {
                                "nodeType": "assignment",
                                "checkConstantAssignment": false,
                                "assignee": {
                                    "nodeType": "identifier",
                                    "value": "x",
                                },
                                "children": [
                                    {
                                        "nodeType": "number",
                                        "value": 3,
                                    }
                                ]
                            }
                        },
                        {
                            "nodeType": "while-statement",
                            "children": [],
                            "body": {
                                "nodeType": "block-statement",
                                "children": [
                                    {
                                        "nodeType": "block-statement",
                                        "children": []
                                    },
                                    {
                                        "nodeType": "block-statement",
                                        "children": []
                                    }
                                ]
                            }
                        }
                    ]
                }
            ]
        });
    });

    it("must initialize a constant", () => {
        expectArray(retreiveErrors("const a;"), [
            {
                msg: `Constant must be initialized.`,
            },
        ]);
    });

});