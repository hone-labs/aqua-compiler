import { IToken, Tokenizer, TokenType } from "../tokenizer";

describe("tokenizer", () => {

    //
    // Helper function that converts code to an array of tokens, not including
    // the EOF token.
    //
    function tokenize(code: string): IToken[] {

        const tokenizer = new Tokenizer(code);
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

    test("can tokenize + operator", () => {

        const tokenizer = new Tokenizer("+");
        tokenizer.readNext();

        expect(tokenizer.getCurrent()).toEqual({ type: TokenType.PLUS });
    });

    test("can skip whitespace", () => {

        const tokenizer = new Tokenizer(" \t\r\n+");
        tokenizer.readNext();

        expect(tokenizer.getCurrent()).toEqual({ type: TokenType.PLUS });


    });

    test("register EOF token at end of input", () => {

        const tokenizer = new Tokenizer("");
        tokenizer.readNext();

        expect(tokenizer.getCurrent()).toEqual({ type: TokenType.EOF });
    });

    test("register EOF token at end of input after whitespace", () => {

        const tokenizer = new Tokenizer(" ");
        tokenizer.readNext();

        expect(tokenizer.getCurrent()).toEqual({ type: TokenType.EOF });
    });

    test("registers an error for an unexpected character", () => {

        let errorReported = false;
        const tokenizer = new Tokenizer("@", () => {
            errorReported = true;
        });
        tokenizer.readNext();

        expect(errorReported).toBe(true);
        expect(tokenizer.getCurrent()).toEqual({ type: TokenType.EOF });
    });

    test("moves onto next character after an unexpected character", () => {

        const tokenizer = new Tokenizer("@+");
        tokenizer.readNext();

        expect(tokenizer.getCurrent()).toEqual({ type: TokenType.PLUS });
    });

    test("skips whitespace between unrecognised character and next token", () => {

        const tokenizer = new Tokenizer("@ +");
        tokenizer.readNext();

        expect(tokenizer.getCurrent()).toEqual({ type: TokenType.PLUS });
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

        expect(tokenize("0")).toEqual([{ type: TokenType.NUMBER, value: 0 }]);
        expect(tokenize("1")).toEqual([{ type: TokenType.NUMBER, value: 1 }]);
        expect(tokenize("123")).toEqual([{ type: TokenType.NUMBER, value: 123 }]);
        expect(tokenize("1.")).toEqual([{ type: TokenType.NUMBER, value: 1 }]);
        expect(tokenize("0.0")).toEqual([{ type: TokenType.NUMBER, value: 0 }]);
        expect(tokenize("2.0")).toEqual([{ type: TokenType.NUMBER, value: 2 }]);
        expect(tokenize("2.1")).toEqual([{ type: TokenType.NUMBER, value: 2.1 }]);
        expect(tokenize("2.120")).toEqual([{ type: TokenType.NUMBER, value: 2.12 }]);
    });

    test("can tokenize an expression", () => {

        // No whitespace.
        expect(tokenize("1+2")).toEqual([ 
            { type: TokenType.NUMBER, value: 1 },
            { type: TokenType.PLUS },
            { type: TokenType.NUMBER, value: 2 },
        ]);

        // With whitespace.
        expect(tokenize(" 1 + 2 ")).toEqual([ 
            { type: TokenType.NUMBER, value: 1 },
            { type: TokenType.PLUS },
            { type: TokenType.NUMBER, value: 2 },
        ]);

    });
});