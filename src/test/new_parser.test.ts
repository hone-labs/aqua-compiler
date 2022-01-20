import { parse, parseExpression } from "../new_parser";

describe("parser", () => {

    test("can parse number expression", () => {

        expect(parseExpression("12")).toEqual({
            nodeType: "operation",
            opcode: "int",
            type: "integer",
            args: [
                12
            ],
        });
    });

    test("can parse addition expression", () => {

        expect(parseExpression("1+2")).toEqual({
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

    test("can parse addition expression statement", () => {

        expect(parse("1;")).toEqual({
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

});