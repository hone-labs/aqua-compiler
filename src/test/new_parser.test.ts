import { parse, parseExpression } from "../new_parser";
import { IError } from "../tokenizer";

describe("parser", () => {

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
            const expectedValue  = expected[key];
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

    test("error reports line and column", () => {

        expectArray(retreiveErrors("@;"), [{ line: 1, column: 0 }]);
        expectArray(retreiveErrors("\n@;"), [{ line: 2, column: 0 }]);
        expectArray(retreiveErrors(" @;"), [{ line: 1, column: 1 }]);
        expectArray(retreiveErrors("\n @;"), [{ line: 2, column: 1 }]);
    });
});