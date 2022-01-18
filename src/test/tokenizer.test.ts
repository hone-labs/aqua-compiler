import { Tokenizer, TokenType } from "../tokenizer";

describe("tokenizer", () => {

    test("can tokenize + operator", () => {

        const tokenizer = new Tokenizer("+");
        tokenizer.readNext();

        expect(tokenizer.getCurrent()).toEqual({ type: TokenType.PLUS });

    });

});