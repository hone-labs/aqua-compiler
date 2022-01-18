import { Tokenizer, TokenType } from "../tokenizer";

describe("tokenizer", () => {

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
        tokenizer.readNext();

        expect(tokenizer.getCurrent()).toEqual({ type: TokenType.PLUS });


    });

});