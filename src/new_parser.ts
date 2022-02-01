//
// Parser for the Aqua language.
//

import { AST } from "yaml";
import { ASTNode } from "./ast";
import { IError, IToken, ITokenizer, OnErrorFn, Tokenizer, TokenType, TOKEN_NAME } from "./tokenizer";

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
    private onError?: OnErrorFn;

    constructor(code: string, onError?: OnErrorFn) {
        this.tokenizer = new Tokenizer(code, onError);
        this.tokenizer.readNext(); // Read first token.
        this.onError = onError;
    }

    //
    // Parses an entire TEAL program.
    //
    program(): ASTNode {
        return {
            nodeType: "block-statment", //TODO: fix spelling later.
            children: this.declarations(),
        };
    }

    //
    // Parse top level declarations.
    //
    private declarations(): ASTNode[] {
        const stmts: ASTNode[] = [];

        while (!this.peek(TokenType.EOF)) {
            try {
                stmts.push(this.declaration());
            }
            catch (err) {
                // Error should have already been raised.
                // At this point we just want to resynchronize to the next statement.
                this.syncNextStatement();
            }
        }

        return stmts;
    }

    //
    // Parses a top level declaration.
    //
    private declaration(): ASTNode {
        if (this.match(TokenType.FUNCTION)) {
            return this.function();
        }

        return this.statement();
    }

    //
    // Parses a function declaration.
    //
    private function(): ASTNode {
        const identifier = this.expect(TokenType.IDENTIFIER);

        this.expect(TokenType.OPEN_PAREN);
        const params = this.parameters();        
        
        this.expect(TokenType.OPEN_BRACKET);
        const body = this.blockStatement();

        return {
            nodeType: "function-declaration",
            name: identifier.value!,
            params: params,
            body: body,
        };
    }

    //
    // Parses a list of function parameters.
    //
    private parameters(): string[] {

        const params: string[] = [];

        while (!this.peek(TokenType.CLOSE_PAREN)) {

            if (params.length > 0) {
                this.expect(TokenType.COMMA);
            }

            const identifier = this.expect(TokenType.IDENTIFIER);
            params.push(identifier.value!);
        }

        this.expect(TokenType.CLOSE_PAREN);        

        return params;
    }

    //
    // Parses multiple statements.
    //
    private statements(endToken: TokenType): ASTNode[] {
        const stmts: ASTNode[] = [];

        while (!this.peek(endToken)) {
            try {
                stmts.push(this.statement());
            }
            catch (err) {
                // Error should have already been raised.
                // At this point we just want to resynchronize to the next statement.
                this.syncNextStatement();
            }
        }

        return stmts;
    }

    //
    // Discards token until we find a token that can end a statement so we can resynchronize the parser.
    //
    private syncNextStatement(): void {
        while (!this.isAtEnd()) {
            const token = this.tokenizer.getCurrent();
            this.tokenizer.readNext(); // Skip token.

            if (token && token.type === TokenType.SEMICOLON) { //todo: move this to an array of token types!
                break; // After skipping a semicolon we should be at a new statement.
            }
        }
    }

    //
    // Parses a single statement.
    //
    private statement(): ASTNode {
        if (this.match(TokenType.SEMICOLON)) {
            return {
                nodeType: "block-statment", // Empty statement.
                children: [],
            };
        }
        else if (this.match(TokenType.CONST)) {
            return this.variableDeclaration(true);
        }
        else if (this.match(TokenType.LET)) {
            return this.variableDeclaration(false);
        }
        else if (this.match(TokenType.OPEN_BRACKET)) {
            return this.blockStatement();
        }
        else if (this.match(TokenType.RETURN)) {
            return this.returnStatement();
        }
        
        return this.exprStatement();
    }

    //
    // Parses a constant declaration.
    //
    private variableDeclaration(isConstant: boolean): ASTNode {

        const identifier = this.expect(TokenType.IDENTIFIER);
        this.expect(TokenType.ASSIGNMENT);

        const initializer = this.expression();       

        this.expect(TokenType.SEMICOLON);

        return {
            nodeType: "declare-variable",
            name: identifier.value!,
            symbolType: isConstant ? 1 : 0, // Constant. TOOD: This shouldn't be hardcoded - after new parser is finished.
            children: [
                initializer,
            ],
        };
    }

    //
    // Parses a block statement.
    //
    private blockStatement(): ASTNode {

        const stmts = this.statements(TokenType.CLOSE_BRACKET);
        this.expect(TokenType.CLOSE_BRACKET);

        return {
            nodeType: "block-statment", // TODO: Fix spelling later.
            children: stmts,
        };
    }

    //
    // Parses a return statement.
    //
    private returnStatement(): ASTNode {
        const expr = this.expression();

        this.expect(TokenType.SEMICOLON);

        return {
            nodeType: "return-statement",
            children: [
                expr,
            ],
        };
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
                continue;
            }

            if (this.match(TokenType.MINUS)) {
                const right = this.primary();
                working = {
                    nodeType: "operation",
                    opcode: "-",
                    type: "integer",
                    children: [
                        working, 
                        right,
                    ],
                };
                continue;
            }

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
            };
        }

        const identifierToken = this.match(TokenType.IDENTIFIER);
        if (identifierToken) {
            return {
                nodeType: "access-variable",
                name: identifierToken.value!,
            };
        }

        const token = this.tokenizer.getCurrent();
        const msg = `Unexpected token "${token!.string}"`;
        this.raiseError({
            msg: msg,
            line: token!.line,
            column: token!.column,
        });
        throw new Error(msg);
    }

    //
    // Returns true if the current token is a particular type.
    //
    private peek(type: TokenType): boolean {
        const curToken = this.tokenizer.getCurrent();
        return curToken && curToken.type === type || false;
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
    private expect(type: TokenType): IToken {
        const token = this.tokenizer.getCurrent()!;
        if (!this.match(type)) {
            const msg = `Expected token "${TOKEN_NAME[type]}", found token "${TOKEN_NAME[token.type]}"`;
            this.raiseError({ 
                msg: msg,
                line: token.line,
                column: token.column,
            });

            throw new Error(msg); 
        }
        return token;
    }

    //
    // Reports an error to the next level up.
    //
    private raiseError(err: IError): void {
        if (this.onError) {
            this.onError(err);
        }
    }

    //
    // Returns true when we have reached the end-of-file token in the source code.
    //
    private isAtEnd(): boolean {
        const token = this.tokenizer.getCurrent();
        if (token && token.type === TokenType.EOF) {
            // Found an EOF token.
            return true;
        }

        return false;
    }
}

//
// Helper function for testing.
//
export function parseExpression(code: string, onError?: OnErrorFn): ASTNode {
    const parser = new Parser(code, onError);
    return parser.expression();
}

//
// Helper function for testing.
//
export function parse(code: string, onError?: OnErrorFn): ASTNode {
    const parser = new Parser(code, onError);
    return parser.program();
}
