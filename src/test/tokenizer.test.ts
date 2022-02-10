import { IError, IToken, OnErrorFn, Tokenizer, TokenType } from "../tokenizer";

describe("tokenizer", () => {

    //
    // Helper function that converts code to an array of tokens, not including
    // the EOF token.
    //
    function tokenize(code: string, onError?: OnErrorFn): IToken[] {

        const tokenizer = new Tokenizer(code, onError);
        const tokens: IToken[] = [];

        tokenizer.readNext();

        while (tokenizer.getCurrent()!.type !== TokenType.EOF) {
            const token = tokenizer.getCurrent();
            if (!token) {
                throw new Error(`Expected a token if not at the end!`);
            }
            tokens.push(token);
            tokenizer.readNext();
        }

        return tokens;       
    }

    //
    // Tokenizes code and only returns the errors produced.
    //
    function retreiveErrors(code: string): IError[] {

        let errors: IError[] = [];

        tokenize(code, err => {
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

    test("registers EOF token at end of input after whitespace", () => {

        const tokenizer = new Tokenizer(" ");
        tokenizer.readNext();

        expectFields(tokenizer.getCurrent(), { type: TokenType.EOF });
    });

    test("can scan various tokens", () => {

        expectArray(tokenize("+"), [{ type: TokenType.PLUS }]);
        expectArray(tokenize("-"), [{ type: TokenType.MINUS }]);
        expectArray(tokenize(";"), [{ type: TokenType.SEMICOLON }]);
        expectArray(tokenize("const"), [{ type: TokenType.CONST }]);
        expectArray(tokenize("let"), [{ type: TokenType.LET }]);
        expectArray(tokenize("="), [{ type: TokenType.ASSIGNMENT }]);
        expectArray(tokenize("("), [{ type: TokenType.OPEN_PAREN }]);
        expectArray(tokenize(")"), [{ type: TokenType.CLOSE_PAREN }]);
        expectArray(tokenize("{"), [{ type: TokenType.OPEN_BRACKET }]);
        expectArray(tokenize("}"), [{ type: TokenType.CLOSE_BRACKET }]);
        expectArray(tokenize("function"), [{ type: TokenType.FUNCTION }]);
        expectArray(tokenize(","), [{ type: TokenType.COMMA }]);
        expectArray(tokenize("return"), [{ type: TokenType.RETURN }]);
        expectArray(tokenize("if"), [{ type: TokenType.IF }]);
        expectArray(tokenize("else"), [{ type: TokenType.ELSE }]);
        expectArray(tokenize("for"), [{ type: TokenType.FOR }]);
        expectArray(tokenize("while"), [{ type: TokenType.WHILE }]);
        expectArray(tokenize("&&"), [{ type: TokenType.AND }]);
        expectArray(tokenize("||"), [{ type: TokenType.OR }]);
        expectArray(tokenize("=="), [{ type: TokenType.EQ }]);
        expectArray(tokenize("!="), [{ type: TokenType.NE }]);
        expectArray(tokenize("<="), [{ type: TokenType.LTE }]);
        expectArray(tokenize("<"), [{ type: TokenType.LT }]);
        expectArray(tokenize(">="), [{ type: TokenType.GTE }]);
        expectArray(tokenize(">"), [{ type: TokenType.GT }]);
    });

    test("can scan identifier", () => {
        expectArray(tokenize("abc"), [{ 
            type: TokenType.IDENTIFIER,
            value: "abc",
        }]);
    });

    test("can skip whitespace", () => {

        const tokenizer = new Tokenizer(" \t\r\n+");
        tokenizer.readNext();

        expectFields(tokenizer.getCurrent(), { type: TokenType.PLUS });
    });

    test("registers EOF token at end of input", () => {

        const tokenizer = new Tokenizer("");
        tokenizer.readNext();

        expectFields(tokenizer.getCurrent(), { type: TokenType.EOF });
    });


    test("registers an error for an unexpected character", () => {

        let errorReported = false;
        const tokenizer = new Tokenizer("@", () => {
            errorReported = true;
        });
        tokenizer.readNext();

        expect(errorReported).toBe(true);
        expectFields(tokenizer.getCurrent(), { type: TokenType.EOF });
    });

    test("error reports line and column", () => {

        expectArray(retreiveErrors("@"), [{ line: 1, column: 0 }]);
        expectArray(retreiveErrors("\n@"), [{ line: 2, column: 0 }]);
        expectArray(retreiveErrors("\r\n@"), [{ line: 2, column: 0 }]);
        expectArray(retreiveErrors(" @"), [{ line: 1, column: 1 }]);
        expectArray(retreiveErrors("\n@"), [{ line: 2, column: 0 }]);
        expectArray(retreiveErrors("\n @"), [{ line: 2, column: 1 }]);
    });

    test("moves onto next character after an unexpected character", () => {

        const tokenizer = new Tokenizer("@+");
        tokenizer.readNext();

        expectFields(tokenizer.getCurrent(), { type: TokenType.PLUS });
    });

    test("skips whitespace between unrecognised character and next token", () => {

        const tokenizer = new Tokenizer("@ +");
        tokenizer.readNext();

        expectFields(tokenizer.getCurrent(), { type: TokenType.PLUS });
    });

    test("empty code triggers EOF immediately", () => {

        const tokenizer = new Tokenizer("+");
        tokenizer.readNext();
        expect(tokenizer.isAtEnd()).toEqual(true);

        tokenizer.readNext(); // No effect.
    });

    test("code with a token triggers EOF later", () => {

        const tokenizer = new Tokenizer("+ +");

        tokenizer.readNext(); // Consumes first token.
        expect(tokenizer.isAtEnd()).toEqual(false);

        tokenizer.readNext(); // Consumes second token., triggers EOF.
        expect(tokenizer.isAtEnd()).toEqual(true);
    });

    test("can tokenize various numbers", () => {

        expectArray(tokenize("0"), [{ type: TokenType.NUMBER, value: 0 }]);
        expectArray(tokenize("1"), [{ type: TokenType.NUMBER, value: 1 }]);
        expectArray(tokenize("123"), [{ type: TokenType.NUMBER, value: 123 }]);
    });

    test("can tokenize an expression", () => {

        // No whitespace.
        expectArray(tokenize("1+2"), [ 
            { type: TokenType.NUMBER, value: 1 },
            { type: TokenType.PLUS },
            { type: TokenType.NUMBER, value: 2 },
        ]);

        // With whitespace.
        expectArray(tokenize(" 1 + 2 "), [ 
            { type: TokenType.NUMBER, value: 1 },
            { type: TokenType.PLUS },
            { type: TokenType.NUMBER, value: 2 },
        ]);
    });
});