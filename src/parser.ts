//
// Parser for the Aqua language.
//

import { ASTNode } from "./ast";
import { IToken, ITokenizer, OnErrorFn, Tokenizer, TokenType, TOKEN_NAME } from "./tokenizer";

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
    private onError: OnErrorFn;

    constructor(code: string, onError: OnErrorFn) {
        this.tokenizer = new Tokenizer(code, onError);
        this.tokenizer.readNext(); // Read first token.
        this.onError = onError;
    }

    //
    // Parses an entire TEAL program.
    //
    program(): ASTNode {
        return {
            nodeType: "block-statement",
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

            if (token && token.type === TokenType.SEMICOLON) {
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
                nodeType: "block-statement", // Empty statement.
                children: [],
            };
        }
        else if (this.match(TokenType.CONST)) {
            const decl = this.variableDeclaration(true);
            this.expect(TokenType.SEMICOLON);
            return decl;
        }
        else if (this.match(TokenType.LET)) {
            const decl = this.variableDeclaration(false);
            this.expect(TokenType.SEMICOLON);
            return decl;
        }
        else if (this.match(TokenType.OPEN_BRACKET)) {
            return this.blockStatement();
        }
        else if (this.match(TokenType.RETURN)) {
            return this.returnStatement();
        }
        else if (this.match(TokenType.IF)) {
            return this.ifStatement();
        }
        else if (this.match(TokenType.WHILE)) {
            return this.whileStatement();
        }
        else if (this.match(TokenType.FOR)) {
            return this.forStatement();
        }
        
        return this.exprStatement();
    }

    //
    // Parses a constant declaration.
    //
    private variableDeclaration(isConstant: boolean): ASTNode {

        const identifier = this.expect(TokenType.IDENTIFIER);

        let initializer: ASTNode | undefined;

        if (this.match(TokenType.ASSIGNMENT)) {
            initializer = this.expression();          
        }
        else if (isConstant) {
            //
            // Constants must be initialised!
            //
            const msg = `Constant ${identifier.value!} must be initialized.`;
            this.onError({
                msg: msg,
                line: identifier.line,
                column: identifier.column,
            });
            throw new Error(msg);
        }

        const children = initializer !== undefined
            ? [ initializer ]
            : undefined;

        return {
            nodeType: "declare-variable",
            name: identifier.value!,
            symbolType: isConstant ? 1 : 0, // Constant. TOOD: This shouldn't be hardcoded - after new parser is finished.
            children: children,
        };
    }

    //
    // Parses a block statement.
    //
    private blockStatement(): ASTNode {

        const stmts = this.statements(TokenType.CLOSE_BRACKET);
        this.expect(TokenType.CLOSE_BRACKET);

        return {
            nodeType: "block-statement",
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
    // Parses an if statement.
    //
    private ifStatement(): ASTNode {

        this.expect(TokenType.OPEN_PAREN);

        const conditionalExpr = this.expression();

        this.expect(TokenType.CLOSE_PAREN);

        const ifBlock = this.statement();
        
        let elseBlock: ASTNode | undefined;

        if (this.match(TokenType.ELSE)) {
            elseBlock = this.statement();
        }

        return {
            nodeType: "if-statement",
            children: [
                conditionalExpr,
            ],
            ifBlock: ifBlock,
            elseBlock: elseBlock,
        };
    }

    //
    // Parses a while statement.
    //
    private whileStatement(): ASTNode {
        this.expect(TokenType.OPEN_PAREN);

        const conditionalExpr = this.expression();

        this.expect(TokenType.CLOSE_PAREN);

        const whileBody = this.statement();

        return {
            nodeType: "while-statement",
            children: [
                conditionalExpr,
            ],
            body: whileBody,
        };
    }

    //
    // Parses a for statement.
    //
    private forStatement(): ASTNode {
        this.expect(TokenType.OPEN_PAREN);

        let initializer: ASTNode | undefined;
        if (!this.peek(TokenType.SEMICOLON)) {
            if (this.match(TokenType.CONST)) {
                initializer = this.variableDeclaration(true);
            }
            else if (this.match(TokenType.LET)) {
                initializer = this.variableDeclaration(false);
            }
            else {
                initializer = {
                    nodeType: "expr-statement",
                    children: [
                        this.expression()
                    ],
                };
            }
        }

        this.expect(TokenType.SEMICOLON);

        let conditional: ASTNode | undefined;
        if (!this.peek(TokenType.SEMICOLON)) {
            conditional = this.expression();
        }

        this.expect(TokenType.SEMICOLON);

        let increment: ASTNode | undefined;
        if (!this.peek(TokenType.CLOSE_PAREN)) {
            increment = this.expression();
        }

        this.expect(TokenType.CLOSE_PAREN);

        const forBody = this.statement();

        return {
            nodeType: "block-statement",
            children: [
                (initializer !== undefined //TODO: This code can do with some revision.
                    ? initializer
                    : {
                        nodeType: "block-statement",
                        children: [],
                    }
                ),
                {
                    nodeType: "while-statement",
                    children: [
                        (conditional !== undefined //TODO: This code can do with some revision.
                            ? conditional
                            : {
                                nodeType: "block-statement",
                                children: []
                            }
                        ),
                    ],
                    body: {
                        nodeType: "block-statement",
                        children: [
                            forBody,
                            (increment !== undefined //TODO: This code can do with some revision.
                                ? {
                                    nodeType: "expr-statement",
                                    children: [
                                        increment,
                                    ],
                                }
                                : {
                                    nodeType: "block-statement",
                                    children: [],
                                }
                            ),
                        ],
                    },
                },
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
        return this.assignment();
    }

    //
    // Parses an assignment expression.
    //
    private assignment(): ASTNode {
        const assignee = this.logical();

        if (this.match(TokenType.ASSIGNMENT)) {
            const initializer = this.expression();
            return {
                nodeType: "assignment-statement",
                assignee: assignee,
                children: [
                    initializer,
                ],
            };
        }
        else {
            return assignee;
        }
    }

    //
    // Parses a logical expression.
    //
    private logical(): ASTNode {
        let working = this.equality();

        while (true) {
            if (this.match(TokenType.AND)) {
                const right = this.equality();
                working = {
                    nodeType: "operation",
                    opcode: "&&",
                    children: [
                        working,
                        right,
                    ],
                };
                continue;
            }

            if (this.match(TokenType.OR)) {
                const right = this.equality();
                working = {
                    nodeType: "operation",
                    opcode: "||",
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
    // Parses an equality expression.
    //
    private equality(): ASTNode {
        let working = this.comparison();

        while (true) {
            if (this.match(TokenType.EQ)) {
                const right = this.comparison();
                working = {
                    nodeType: "operation",
                    opcode: "==",
                    children: [
                        working,
                        right,
                    ],
                };
                continue;
            }

            if (this.match(TokenType.NE)) {
                const right = this.comparison();
                working = {
                    nodeType: "operation",
                    opcode: "!=",
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
    // Parses a comparison expression.
    //
    private comparison(): ASTNode {
        let working = this.term();

        while (true) {
            if (this.match(TokenType.LT)) {
                const right = this.term();
                working = {
                    nodeType: "operation",
                    opcode: "<",
                    children: [
                        working,
                        right,
                    ],
                };
                continue;
            }

            if (this.match(TokenType.LTE)) {
                const right = this.term();
                working = {
                    nodeType: "operation",
                    opcode: "<=",
                    children: [
                        working,
                        right,
                    ],
                };
                continue;
            }

            if (this.match(TokenType.GT)) {
                const right = this.term();
                working = {
                    nodeType: "operation",
                    opcode: ">",
                    children: [
                        working,
                        right,
                    ],
                };
                continue;
            }

            if (this.match(TokenType.GTE)) {
                const right = this.term();
                working = {
                    nodeType: "operation",
                    opcode: ">=",
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
    // Parses an addition/subtraction expression.
    //
    private term(): ASTNode {
        let working = this.factor();

        while (true) {
            if (this.match(TokenType.PLUS)) {
                const right = this.factor();
                working = {
                    nodeType: "operation",
                    opcode: "+",
                    children: [
                        working, 
                        right,
                    ],
                };
                continue;
            }

            if (this.match(TokenType.MINUS)) {
                const right = this.factor();
                working = {
                    nodeType: "operation",
                    opcode: "-",
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
    // Parses a multiplication or division expression.
    //
    private factor(): ASTNode {
        let working = this.unary();

        while (true) {
            if (this.match(TokenType.MULTIPLY)) {
                const right = this.unary();
                working = {
                    nodeType: "operation",
                    opcode: "*",
                    children: [
                        working,
                        right,
                    ],
                };
                continue;
            }

            if (this.match(TokenType.DIVIDE)) {
                const right = this.unary();
                working = {
                    nodeType: "operation",
                    opcode: "/",
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
    // Parses a unary expression.
    //
    private unary(): ASTNode {
        if (this.match(TokenType.NOT)) {
            const expression = this.unary();
            return {
                nodeType: "operation",
                opcode: "!",
                children: [
                    expression,
                ],
            };
        }
        else {
            return this.primary();
        }
    }

    //
    // Parse a primary compoent of an expression such as a number or identifier.
    //
    private primary(): ASTNode {

        if (this.match(TokenType.OPEN_PAREN)) {
            const expr = this.expression();
            this.expect(TokenType.CLOSE_PAREN);
            return expr;
        }

        const numberToken = this.match(TokenType.NUMBER);
        if (numberToken) {
            return {
                nodeType: "number",                
                value: numberToken.value!,
            };
        }

        const stringLiteral = this.match(TokenType.STRING);
        if (stringLiteral) {
            return {
                nodeType: "string-literal",
                value: stringLiteral.value!,
            };
        }

        if (this.match(TokenType.TXN)) {
            return this.txn();
        }

        if (this.match(TokenType.GTXN)) {
            return this.gtxn();
        }

        if (this.match(TokenType.ARG)) {
            return this.arg();
        }

        if (this.match(TokenType.ADDR)) {
            return this.addr();
        }

        if (this.match(TokenType.GLOBAL)) {
            return this.dot("global");
        }

        if (this.match(TokenType.ONCOMPLETE)) {
            return this.dot("int");
        }

        if (this.match(TokenType.TYPEENUM)) {
            return this.dot("int");
        }

        const identifierToken = this.match(TokenType.IDENTIFIER);
        if (identifierToken) {

            if (this.match(TokenType.OPEN_PAREN)) {
                return this.functionCall(identifierToken.value!);
            }
            else {
                return {
                    nodeType: "access-variable",
                    name: identifierToken.value!,
                };
            }
        }

        const token = this.tokenizer.getCurrent();
        const msg = `Unexpected token "${token!.string}"`;
        this.onError({
            msg: msg,
            line: token!.line,
            column: token!.column,
        });
        throw new Error(msg);
    }

    //
    // Parses a txn expression.
    //
    private txn(): ASTNode {
        this.expect(TokenType.DOT);

        const nextIdentifier = this.expect(TokenType.IDENTIFIER);

        if (this.match(TokenType.OPEN_BRACE)) {
            const numberToken = this.expect(TokenType.NUMBER);

            this.expect(TokenType.CLOSE_BRACE);

            return {
                nodeType: "operation",
                opcode: "txna",
                args: [
                    nextIdentifier.value!,
                    numberToken.value!,
                ],
            };
        }

        return {
            nodeType: "operation",
            opcode: "txn",
            args: [
                nextIdentifier.value!,
            ],
        };

    }

    //
    // Parses a gtxn expression.
    //
    private gtxn(): ASTNode {

        this.expect(TokenType.OPEN_BRACE);

        const gtxnIndexToken = this.expect(TokenType.NUMBER);

        this.expect(TokenType.CLOSE_BRACE);

        this.expect(TokenType.DOT);

        const fieldIdentifier = this.expect(TokenType.IDENTIFIER);

        if (this.match(TokenType.OPEN_BRACE)) {
            const arrayIndexToken = this.expect(TokenType.NUMBER);

            this.expect(TokenType.CLOSE_BRACE);

            return {
                nodeType: "operation",
                opcode: "gtxna",
                args: [
                    gtxnIndexToken.value!,
                    fieldIdentifier.value!,
                    arrayIndexToken.value!,
                ],
            };
        }

        return {
            nodeType: "operation",
            opcode: "gtxn",
            args: [
                gtxnIndexToken.value!,
                fieldIdentifier.value!,
            ],
        };
    }

    //
    // Parses an arg expression.
    //
    private arg(): ASTNode {
        this.expect(TokenType.OPEN_BRACE);

        const argIndexToken = this.expect(TokenType.NUMBER);

        this.expect(TokenType.CLOSE_BRACE);

        return {
            nodeType: "operation",
            opcode: "arg",
            args: [
                argIndexToken.value!,
            ],
        };
    }

    //
    // Parses an addr expressions.
    //
    private addr(): ASTNode {
        const stringLiteral = this.expect(TokenType.STRING);
        return {
            nodeType:"operation",
            opcode: "addr",
            args: [
                stringLiteral.value!,
            ],
        };
    }

    //
    // Parses a dot expression.
    //
    private dot(opcode: string): ASTNode {
        this.expect(TokenType.DOT);

        const fieldName = this.expect(TokenType.IDENTIFIER);

        return {
            nodeType: "operation",
            opcode: opcode,
            args: [
                fieldName.value!,
            ],
        };
    }

    //
    // Parses a function call.
    //
    private functionCall(functionName: string): ASTNode {

        const args = this.arguments();

        this.expect(TokenType.CLOSE_PAREN);

        return {
            nodeType: "function-call",
            name: functionName,
            functionArgs: args,
        };
    }

    //
    // Parses arguments to a function call.
    //
    private arguments(): ASTNode[] {
        
        const args: ASTNode[] = [];

        while (!this.peek(TokenType.CLOSE_PAREN)) {
            if (args.length > 0) {
                this.expect(TokenType.COMMA);
            }

            args.push(this.expression());
        }

        return args;
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
            this.onError({
                msg: msg,
                line: token.line,
                column: token.column,
            });
            throw new Error(msg);
        }
        return token;
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
export function parseExpression(code: string, onError: OnErrorFn): ASTNode {
    const parser = new Parser(code, onError);
    return parser.expression();
}

//
// Helper function for testing.
//
export function parse(code: string, onError: OnErrorFn): ASTNode {
    const parser = new Parser(code, onError);
    return parser.program();
}
