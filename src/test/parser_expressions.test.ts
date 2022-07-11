import { ASTNode } from "../ast";
import { parseExpression } from "../parser";
import { IError } from "../tokenizer";

describe("parser", () => {

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

    test("can parse number expression", () => {

        expect(parseExpressionOk("12")).toEqual({
            nodeType: "number",
            value: 12,
        });
    });

    test("can parse tuple expression", () => {

        const ast = parseExpressionOk("(1, 2)");
        expect(ast).toEqual( {
            nodeType: 'tuple',
            children: [
                { 
                    nodeType: 'number', 
                    value: 1 
                },
                { 
                    nodeType: 'number', 
                    value: 2 
                }
            ]
        });
    });

    test("can parse addition expression", () => {

        expect(parseExpressionOk("1+2")).toEqual({
            nodeType: "operation",
            opcode: "+",
            children: [
                {
                    nodeType: "number",
                    value: 1,
                },
                {
                    nodeType: "number",
                    value: 2,
                }
            ],
        });
    });

    test("can parse continued addition expression", () => {

        expect(parseExpressionOk("1+2+3")).toEqual({
            "nodeType": "operation",
            "opcode": "+",
            "children": [
                {
                    "nodeType": "operation",
                    "opcode": "+",
                    "children": [
                        {
                            "nodeType": "number",
                            "value": 1,
                        },
                        {
                            "nodeType": "number",
                            "value": 2,
                        }
                    ]
                },
                {
                    "nodeType": "number",
                    "value": 3,
                }
            ]
        });
    });

    test("can parse subtraction expression", () => {

        expect(parseExpressionOk("1-2")).toEqual({
            nodeType: "operation",
            opcode: "-",
            children: [
                {
                    nodeType: "number",
                    value: 1,
                },
                {
                    nodeType: "number",
                    value: 2,
                }
            ],
        });
    });

    test("can parse continued subtraction expression", () => {

        const ast = parseExpressionOk("1-2-3");
        expect(ast).toEqual({
            "nodeType": "operation",
            "opcode": "-",
            "children": [
                {
                    "nodeType": "operation",
                    "opcode": "-",
                    "children": [
                        {
                            "nodeType": "number",
                            "value": 1,
                        },
                        {
                            "nodeType": "number",
                            "value": 2,
                        }
                    ]
                },
                {
                    "nodeType": "number",
                    "value": 3,
                }
            ]
        });
    });

    test("can parse variable access", () => {

        const ast = parseExpressionOk("foo");
        expect(ast).toEqual({
            "nodeType": "identifier",
            "value": "foo"
        });
    });

    test("can parse function call", () => {

        const ast = parseExpressionOk("foo()");
        expect(ast).toEqual({
            "nodeType": "function-call",
            "value": "foo",
            "functionArgs": []
        });
    });

    test("can parse function call with arguments", () => {

        const ast = parseExpressionOk("foo(1, 2, 3)");
        expect(ast).toEqual({
            "nodeType": "function-call",
            "value": "foo",
            "functionArgs": [
                {
                    "nodeType": "number",
                    "value": 1,
                },
                {
                    "nodeType": "number",
                    "value": 2,
                },
                {
                    "nodeType": "number",
                    "value": 3,
                }
            ]
        });
    });

    test("can parse parenthesized expression", () => {

        const ast = parseExpressionOk("(1)");
        expect(ast).toEqual({
            "nodeType": "number",
            "value": 1,
        });
    });

    test("can parse assignment expression", () => {

        const ast = parseExpressionOk("x = 3");
        expect(ast).toEqual({
            "nodeType": "assignment",
            "checkConstantAssignment": true,
            "assignee": {
                "nodeType": "identifier",
                "value": "x"
            },
            "children": [
                {
                    "nodeType": "number",
                    "value": 3,
                }
            ]
        });
    });

    test("can parse logical and expression", () => {

        const ast = parseExpressionOk("1 && 2");
        expect(ast).toEqual({
            "nodeType": "operation",
            "opcode": "&&",
            "children": [
                {
                    "nodeType": "number",
                    "value": 1,
                },
                {
                    "nodeType": "number",
                    "value": 2,
                }
            ]
        });
    });

    test("can parse logical or expression", () => {

        const ast = parseExpressionOk("1 || 2");
        expect(ast).toEqual({
            "nodeType": "operation",
            "opcode": "||",
            "children": [
                {
                    "nodeType": "number",
                    "value": 1,
                },
                {
                    "nodeType": "number",
                    "value": 2,
                }
            ]
        });
    });

    test("can parse equality expression", () => {

        const ast = parseExpressionOk("1 == 2");
        expect(ast).toEqual({
            "nodeType": "operation",
            "opcode": "==",
            "children": [
                {
                    "nodeType": "number",
                    "value": 1,
                },
                {
                    "nodeType": "number",
                    "value": 2,
                }
            ]
        });
    });

    test("can parse not equal expression", () => {

        const ast = parseExpressionOk("1 != 2");
        expect(ast).toEqual({
            "nodeType": "operation",
            "opcode": "!=",
            "children": [
                {
                    "nodeType": "number",
                    "value": 1,
                },
                {
                    "nodeType": "number",
                    "value": 2,
                }
            ]
        });
    });

    test("can parse gt expression", () => {

        const ast = parseExpressionOk("1 > 2");
        expect(ast).toEqual({
            "nodeType": "operation",
            "opcode": ">",
            "children": [
                {
                    "nodeType": "number",
                    "value": 1,
                },
                {
                    "nodeType": "number",
                    "value": 2,
                }
            ]
        });
    });

    test("can parse gte expression", () => {

        const ast = parseExpressionOk("1 >= 2");
        expect(ast).toEqual({
            "nodeType": "operation",
            "opcode": ">=",
            "children": [
                {
                    "nodeType": "number",
                    "value": 1,
                },
                {
                    "nodeType": "number",
                    "value": 2,
                }
            ]
        });
    });

    test("can parse lt expression", () => {

        const ast = parseExpressionOk("1 < 2");
        expect(ast).toEqual({
            "nodeType": "operation",
            "opcode": "<",
            "children": [
                {
                    "nodeType": "number",
                    "value": 1,
                },
                {
                    "nodeType": "number",
                    "value": 2,
                }
            ]
        });
    });

    test("can parse lte expression", () => {

        const ast = parseExpressionOk("1 <= 2");
        expect(ast).toEqual({
            "nodeType": "operation",
            "opcode": "<=",
            "children": [
                {
                    "nodeType": "number",
                    "value": 1,
                },
                {
                    "nodeType": "number",
                    "value": 2,
                }
            ]
        });
    });

    test("can parse multiply expression", () => {

        const ast = parseExpressionOk("1 * 2");
        expect(ast).toEqual({
            "nodeType": "operation",
            "opcode": "*",
            "children": [
                {
                    "nodeType": "number",
                    "value": 1,
                },
                {
                    "nodeType": "number",
                    "value": 2,
                }
            ]
        });
    });

    test("can parse divide expression", () => {

        const ast = parseExpressionOk("1 / 2");
        expect(ast).toEqual({
            "nodeType": "operation",
            "opcode": "/",
            "children": [
                {
                    "nodeType": "number",
                    "value": 1,
                },
                {
                    "nodeType": "number",
                    "value": 2,
                }
            ]
        });
    });

    test("can parse not expression", () => {

        const ast = parseExpressionOk("!1");
        expect(ast).toEqual({
            "nodeType": "operation",
            "opcode": "!",
            "children": [
                {
                    "nodeType": "number",
                    "value": 1,
                }
            ]
        });
    });

    test("can parse txn expression", () => {
        const ast = parseExpressionOk("txn.Foo");
        expect(ast).toEqual({
            "nodeType": "operation",
            "numItemsAdded": 1,
            "numItemsRemoved": 0,
            "opcode": "txn",
            "args": [
                "Foo"
            ]
        });
    });

    test("can parse indexed txn expression", () => {
        const ast = parseExpressionOk("txn.Foo[1]");
        expect(ast).toEqual({
            "nodeType": "operation",
            "opcode": "txna",
            "numItemsAdded": 1,
            "numItemsRemoved": 0,
            "args": [
                "Foo",
                1
            ]
        });
    });

    test("can parse gtxn expression", () => {
        const ast = parseExpressionOk("gtxn[1].Foo");
        expect(ast).toEqual({
            "nodeType": "operation",
            "opcode": "gtxn",
            "numItemsAdded": 1,
            "numItemsRemoved": 0,
            "args": [
                1,
                "Foo"
            ]
        });
    });

    test("can parse indexed gtxn expression", () => {
        const ast = parseExpressionOk("gtxn[1].Foo[2]");
        expect(ast).toEqual({
            "nodeType": "operation",
            "opcode": "gtxna",
            "numItemsAdded": 1,
            "numItemsRemoved": 0,
            "args": [
                1,
                "Foo",
                2
            ]
        });
    });

    test("can parse arg expression", () => {
        const ast = parseExpressionOk("arg[1]");
        expect(ast).toEqual({
            "nodeType": "operation",
            "opcode": "arg",
            "numItemsAdded": 1,
            "numItemsRemoved": 0,
            "args": [
                1
            ]
        });
    });

    test("can parse addr expression", () => {
        const ast = parseExpressionOk("addr \"1234\"");
        expect(ast).toEqual({
            "nodeType": "operation",
            "opcode": "addr",
            "numItemsAdded": 1,
            "numItemsRemoved": 0,
            "args": [
                "1234"
            ]
        });
    });

    test("can parse global expression", () => {
        const ast = parseExpressionOk("global.Foo");
        expect(ast).toEqual({
            "nodeType": "operation",
            "opcode": "global",
            "numItemsAdded": 1,
            "numItemsRemoved": 0,
            "args": [
                "Foo"
            ]
        });
    });

    test("can parse OnComplete expression", () => {
        const ast = parseExpressionOk("OnComplete.Foo");
        expect(ast).toEqual({
            "nodeType": "operation",
            "opcode": "int",
            "numItemsAdded": 1,
            "numItemsRemoved": 0,
            "args": [
                "Foo"
            ]
        });
    });

    test("can parse TypeEnum expression", () => {
        const ast = parseExpressionOk("TypeEnum.Foo");
        expect(ast).toEqual({
            "nodeType": "operation",
            "opcode": "int",
            "numItemsAdded": 1,
            "numItemsRemoved": 0,
            "args": [
                "Foo"
            ]
        });
    });

    test("can parse a string literal expression", () => {
        const ast = parseExpressionOk("\"a string\"");
        expect(ast).toEqual({
            nodeType: "string-literal",
            value: "a string",
        });
    });

});