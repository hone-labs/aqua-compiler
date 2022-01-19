//
// Parser for the Aqua language.
//

import { ASTNode } from "./ast";
import { IToken, ITokenizer, Tokenizer, TokenType } from "./tokenizer";

//
// Parses an Aqua expression.
//
function expression(tokenizer: ITokenizer): ASTNode {
    return term(tokenizer);
}

//
// Parses an addition/subtraction expression.
//
function term(tokenizer: ITokenizer): ASTNode {
    let working = primary(tokenizer);

    while (true) {
        if (match(tokenizer, TokenType.PLUS)) {
            const right = primary(tokenizer);
            working = {
                nodeType: "operation",
                opcode: "+",
                type: "integer",
                children: [
                    working, 
                    right,
                ],
            };
        }

        //TODO: Add subtraction here.

        break;
    }

    return working;
}

//
// Parse a primary compoent of an expression such as a number or identifier.
//
function primary(tokenizer: ITokenizer): ASTNode {
    const numberToken = match(tokenizer, TokenType.NUMBER);
    if (numberToken) {
        return {
            nodeType: "operation",
            opcode: "int",
            type: "integer",
            args: [
                numberToken.value!,
            ]
        }
    }

    throw new Error(`Unexpected token`);
}

//
// Matches the current token against an expected token. 
// If it matches the token is returned and the current token is advanced.
// If it doesn't match, undefined is returned.
//
function match(tokenizer: ITokenizer, type: TokenType): IToken | undefined {
    const curToken = tokenizer.getCurrent();
    if (curToken && curToken.type === type) {
        tokenizer.readNext();
        return curToken;
    }
    else {
        return undefined;
    }
}

//
// Exported interface for testing.
//
export function parseExpression(code: string): ASTNode {
    const tokenizer = new Tokenizer(code);
    tokenizer.readNext();
    return expression(tokenizer);
}
