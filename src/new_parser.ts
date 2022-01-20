//
// Parser for the Aqua language.
//

import { ASTNode } from "./ast";
import { IError, IToken, ITokenizer, Tokenizer, TokenType, TOKEN_NAME } from "./tokenizer";

export interface IParser {

    //
    // Parses an entire TEAL program.
    //
    program(): ASTNode;

}

export class Parser implements IParser {
    
    //
    // Converts code into a stream of tokens.
    //
    private tokenizer: ITokenizer;

    //
    // A simple interface that allows the tokenizer to report an error and continue scanning.
    //
    private onError?: (err: IError) => void;

    constructor(code: string, onError?: (err: IError) => void) {
        this.tokenizer = new Tokenizer(code, onError);
        this.tokenizer.readNext(); // Read first token.
        this.onError = onError;
    }

    //
    // Parses an entire TEAL program.
    //
    program(): ASTNode {
        return this.statements();
    }

    //
    // Parses multiple statements.
    //
    private statements(): ASTNode {
        try {
            const stmt = this.statement();
            return {
                nodeType: "block-statment",
                children: [
                    stmt,
                ],
            };
        }
        catch {
            //TODO: This is a syncrhronization point where we should try to parse the next statement.
            return {
                nodeType: "block-statment",
                children: [],
            };
        }
    }

    //
    // Parses a single statement.
    //
    private statement(): ASTNode {
        return this.exprStatement();
    }

    //
    // Parses an expression that consists of an expression.
    //
    private exprStatement(): ASTNode {
        const expr = this.expression();
        this.expect(TokenType.SEMICOLON);
        return {
            nodeType: "expr-statement",
            children: [
                expr,
            ],
        };

    }

    //
    // Parses an Aqua expression.
    //
    expression(): ASTNode {
        return this.term();
    }

    //
    // Parses an addition/subtraction expression.
    //
    private term(): ASTNode {
        let working = this.primary();

        while (true) {
            if (this.match(TokenType.PLUS)) {
                const right = this.primary();
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
    private primary(): ASTNode {
        const numberToken = this.match(TokenType.NUMBER);
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
    private match(type: TokenType): IToken | undefined {
        const curToken = this.tokenizer.getCurrent();
        if (curToken && curToken.type === type) {
            this.tokenizer.readNext();
            return curToken;
        }
        else {
            return undefined;
        }
    }

    //
    // Expects that the next token is a particular token.
    //
    private expect(type: TokenType): void {
        if (!this.match(type)) {
            const msg = `Expected token ${TOKEN_NAME}`;
            this.raiseError(msg);
            throw new Error(msg); 
        }
    }

    //
    // Reports an error to the next level up.
    //
    private raiseError(msg: string): void {
        if (this.onError) {
            this.onError({ msg: msg });
        }
    }
}

//
// Helper function for testing.
//
export function parseExpression(code: string, onError?: (err: IError) => void): ASTNode {
    const parser = new Parser(code, onError);
    return parser.expression();
}

//
// Helper function for testing.
//
export function parse(code: string, onError?: (err: IError) => void): ASTNode {
    const parser = new Parser(code, onError);
    return parser.program();
}
