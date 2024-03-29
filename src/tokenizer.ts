//
// Tokenizer for the Aqua language.
//

import { IError, OnErrorFn } from "./error";

export enum TokenType {
    EOF,
    PLUS,
    MINUS,
    NUMBER,
    SEMICOLON,
    COLON,
    CONST,
    LET,
    ASSIGNMENT,
    IDENTIFIER,
    OPEN_PAREN,
    CLOSE_PAREN,
    OPEN_BRACKET,
    CLOSE_BRACKET,
    OPEN_BRACE,
    CLOSE_BRACE,
    FUNCTION,
    COMMA,
    RETURN,
    IF,
    ELSE,
    WHILE,
    FOR,    
    AND,
    OR,
    EQ,
    NE,
    LTE,
    LT,
    GTE,
    GT,
    MULTIPLY,
    DIVIDE,
    NOT,
    DOT,
    TXN,
    GTXN,
    ARG,
    ADDR,
    GLOBAL,
    ONCOMPLETE,
    TYPEENUM,
    STRING,
    VOID,
    UINT64,
    BYTE,
};

//
// Maps TokenType to the name of each type of token.
//
export const TOKEN_NAME = [
    "end-of-file",
    "+",
    "-",
    "number",
    "semicolon",
    "colon",
    "const",
    "let",
    "=",
    "identifier",
    "(",
    ")",
    "{",
    "}",
    "[",
    "]",
    "function",
    ",",
    "return",
    "if",
    "else",
    "while",
    "for",
    "&&",
    "||",
    "==",
    "!=",
    "<=",
    "<",
    ">=",
    ">",
    "*",
    "/",
    "!",
    ".",
    "txn",
    "gtxn",
    "arg",
    "addr",
    "global",
    "OnComplete",
    "TypeEnum",
    "string literal",
    "void",
    "uint64",
];

//
// A lookup table for single character operators.
//
const SINGLE_CHARACTER_OPERATORS = {
    "+": TokenType.PLUS,
    "-": TokenType.MINUS,
    ";": TokenType.SEMICOLON,
    ":": TokenType.COLON,
    "=": TokenType.ASSIGNMENT,
    "(": TokenType.OPEN_PAREN,
    ")": TokenType.CLOSE_PAREN,
    "{": TokenType.OPEN_BRACKET,
    "}": TokenType.CLOSE_BRACKET,
    "[": TokenType.OPEN_BRACE,
    "]": TokenType.CLOSE_BRACE,
    ",": TokenType.COMMA,
    "<": TokenType.LT,
    ">": TokenType.GT,
    "*": TokenType.MULTIPLY,
    "/": TokenType.DIVIDE,
    "!": TokenType.NOT,
    ".": TokenType.DOT,
}

//
// A lookup table for two character operators.
//
const TWO_CHARACTER_OPERATORS = {
    "&": {
        "&": TokenType.AND,
    },
    "|": {
        "|": TokenType.OR,
    },
    "=": {
        "=": TokenType.EQ,
    },
    "!": {
        "=": TokenType.NE,
    },
    "<": {
        "=": TokenType.LTE,
    },
    ">": {
        "=": TokenType.GTE,
    },
}

//
// Maps a string of characters to a TokenType.
//
export const KEYWORDS = {
    const: TokenType.CONST,
    let: TokenType.LET,
    function: TokenType.FUNCTION,
    return: TokenType.RETURN,
    if: TokenType.IF,
    else: TokenType.ELSE,
    for: TokenType.FOR,
    while: TokenType.WHILE,
    txn: TokenType.TXN,
    gtxn: TokenType.GTXN,
    arg: TokenType.ARG,
    addr: TokenType.ADDR,
    global: TokenType.GLOBAL,
    OnComplete: TokenType.ONCOMPLETE,
    TypeEnum: TokenType.TYPEENUM,
    void: TokenType.VOID,
    uint64: TokenType.UINT64,
    byte: TokenType.BYTE,
};

//
// Represents a token.
//
export interface IToken {
    //
    // Specifies the type of token.
    //
    readonly type: TokenType;

    //
    // The value of the token, for tokens that have a value.
    //
    readonly value?: any;

    //
    // Line number where the token starts.
    //
    readonly line: number;

    //
    // Column number where the token starts.
    //
    readonly column: number;

    //
    // The string value of the token.
    //
    // TODO: This should only be read from the source code buffer when necessary.
    //
    readonly string: string;
}

//
// Interface to a source code tokenizer for the Aqua language.
//
export interface ITokenizer {
    //
    // Scans the next token and makes it the current token.
    //
    readNext(): void;

    //
    // Returns the current token.
    //
    getCurrent(): IToken | undefined;

    //
    // Returns true once all input has been consumed.
    //
    isAtEnd(): boolean;

    //
    // Gets the current line number in the input.
    //
    getLine(): number;

    //
    // Gets the current column number in the input.
    //
    getColumn(): number;    
}

//
// A source code tokenizer for the Aqua language.
//
export class Tokenizer implements ITokenizer {

    //
    // The source code being tokenized.
    //
    private code: string;

    //
    // The current position in the code to read the next token.
    //
    private curPosition: number;

    //
    // Tracks the current line number within the input.
    //
    private curLine: number;

    //
    // Tracks the current column number within the input.
    //
    private curColumn: number;

    //
    // The position in the code where the current token starts.
    //
    private curTokenStart?: number;

    //
    // The line in the code where the current token starts.
    //
    private curTokenLine?: number;

    //
    // The column in the code where the current token starts.
    //
    private curTokenColumn?: number;

    //
    // The most recently scannned token.
    //
    private curToken?: IToken;

    //
    // A simple interface that allows the tokenizer to report an error and continue scanning.
    //
    private onError?: OnErrorFn;

    constructor(code: string, onError?: OnErrorFn) {
        this.code = code;
        this.curPosition = 0;
        this.curLine = 1;
        this.curColumn = 0;
        this.onError = onError;
    }

    //
    // Scans the next token and makes it the current token.
    // This must be called at least once to "prime" the tokenizer before trying to look at the
    // "current token".
    //
    readNext(): void {

        while (true) {
            this.skipWhitespace();

            if (this.isAtEnd()) {
                this.setCurrent({ 
                    type: TokenType.EOF,
                    line: this.curLine,
                    column: this.curColumn,
                    string: "end of file",
                });
                return;
            }

            this.curTokenStart = this.curPosition;
            this.curTokenLine = this.curLine;
            this.curTokenColumn = this.curColumn;

            const ch = this.advance();

            if (ch === "/" && this.peek() === "/") {
                // Single line comment.
                this.skipToNewLine();
                continue;
            }

            const twoCharacterTokenLookup = (TWO_CHARACTER_OPERATORS as any)[ch];
            if (twoCharacterTokenLookup !== undefined) {
                const nextCh = this.peek();
                const twoCharacterTokenType = nextCh !== undefined && twoCharacterTokenLookup[nextCh] || undefined;
                if (twoCharacterTokenType !== undefined) {
                    this.advance();
                    this.setCurrent({
                        type: twoCharacterTokenType,
                        line: this.curTokenLine,
                        column: this.curTokenColumn,
                        string: ch + nextCh,   
                    });
                    return;
                }      
            }          

            const singleCharacterTokenType: TokenType = (SINGLE_CHARACTER_OPERATORS as any)[ch];
            if (singleCharacterTokenType !== undefined) {
                this.setCurrent({ 
                    type: singleCharacterTokenType,
                    line: this.curTokenLine,
                    column: this.curTokenColumn,
                    string: ch,
                }); 
                return;
            }

            if (ch === "\"") {
                this.stringLiteral();
                return;
            }

            if (this.isDigit(ch)) {
                this.readNumber();
                return;
            }

            if (this.isAlpha(ch)) {
                this.readIdentifer();
                return;
            }

            // Report error, then continue scanning at the next character.

            this.raiseError({
                message: `Encountered unexpected character "${ch}"`,
                line: this.curTokenLine,
                column: this.curTokenColumn,
            });
        }    
    }

    //
    // Raises an error.
    //
    private raiseError(err: IError) {
        if (this.onError) {
            this.onError(err);
        }
    }

    //
    // Returns the current token.
    //
    getCurrent(): IToken | undefined {
        return this.curToken;
    }

    //
    // Returns true once all input has been consumed.
    //
    isAtEnd(): boolean {
        return this.curPosition >= this.code.length;
    }

    //
    // Gets the current line number in the input.
    //
    getLine(): number {
        return this.curLine;
    }

    //
    // Gets the current column number in the input.
    //
    getColumn(): number {
        return this.curColumn;
    }

    //
    // Sets the current token.
    //
    private setCurrent(token: IToken) {
        this.curToken = token;
    }

    //
    // Return the current character and then advance the current position by one place.
    //
    private advance(): string {
        const ch = this.code[this.curPosition];
        if (ch === "\n") {
            this.curLine += 1;
            this.curColumn = 0;
        }
        else {
            this.curColumn += 1;
        }
        this.curPosition += 1;
        return ch;
    }

    //
    // Look at the next character in the input without advancing the position.
    // Returns undefined when there is no more input to look at.
    //
    private peek(): string | undefined {
        if (this.isAtEnd()) {
            return undefined;
        }
        return this.code[this.curPosition];
    }

    //
    // Skips whitespace characters in the code.
    //
    private skipWhitespace(): void {
        while (true) {
            const ch = this.peek();
            if (ch === " " || ch === "\t" || ch === "\r" || ch === "\n") {
                this.advance();
            }
            else {                
                break;
            }
        } 
    }

    //
    // Skips to the next new line.
    //
    private skipToNewLine(): void {
        while (true) {
            const ch = this.peek();
            if (ch === "\n") {
                break;
            }
            if (ch === undefined) {
                break;
            }
            this.advance();
        } 
    }

    //
    // https://stackoverflow.com/a/38370808/25868
    //
    private readonly charCodeZero = "0".charCodeAt(0);
    private readonly charCodeNine = "9".charCodeAt(0);    
    private readonly charCodea = "a".charCodeAt(0);
    private readonly charCodez = "z".charCodeAt(0);
    private readonly charCodeA = "A".charCodeAt(0);
    private readonly charCodeZ = "Z".charCodeAt(0);
    private readonly charCode_ = "_".charCodeAt(0);

    //
    // Returns true if the specified charater is a digit.
    //
    private isDigit(ch: string | undefined): boolean {
        if (ch === undefined) {
            // No more input, so by definition it's not a digit.
            return false;
        }
        const charCode = ch.charCodeAt(0); //TODO: Optimization: Just pass the character offset in the original buffer through and then pull the char code directly from the buffer.
        return charCode >= this.charCodeZero  && charCode <= this.charCodeNine;
    }

    //
    // Reads the subsequent digits of a number token.
    //
    private readNumber(): void {
        while (this.isDigit(this.peek())) {
            this.advance();
        }

        const stringValue = this.code.substring(this.curTokenStart!, this.curPosition);

        this.setCurrent({ 
            type: TokenType.NUMBER, 
            value: parseFloat(stringValue),
            line: this.curTokenLine!,
            column: this.curTokenColumn!,
            string: stringValue,
        }); 
    }

    //
    // Returns true if the specified charater is a alphabetical character..
    //
    private isAlpha(ch: string | undefined): boolean {
        if (ch === undefined) {
            // No more input, so by definition it's not a digit.
            return false;
        }
        const charCode = ch.charCodeAt(0); //TODO: Optimization: Just pass the character offset in the original buffer through and then pull the char code directly from the buffer.
        return charCode >= this.charCodea && charCode <= this.charCodez
            || charCode >= this.charCodeA && charCode <= this.charCodeZ
            || charCode === this.charCode_;
    }

    //
    // Returns true if the specified charater is a alphabetical or numerical character.
    //
    private isAlphaNumeric(ch: string | undefined): boolean {
        return this.isAlpha(ch) || this.isDigit(ch);
    }

    //
    // Reads the subsequent digits of an identifier or keyword token.
    //
    private readIdentifer(): void {
        while (this.isAlphaNumeric(this.peek())) {
            this.advance();
        }

        const stringValue = this.code.substring(this.curTokenStart!, this.curPosition);
        const tokenType = (KEYWORDS as any)[stringValue];
        if (tokenType === undefined) {
            this.setCurrent({ 
                type: TokenType.IDENTIFIER, 
                value: stringValue,
                line: this.curTokenLine!,
                column: this.curTokenColumn!,
                string: stringValue,
            }); 
        }
        else {
            this.setCurrent({ 
                type: tokenType, 
                line: this.curTokenLine!,
                column: this.curTokenColumn!,
                string: stringValue,
            }); 
        }
    }

    //
    // Reads the characters of a string literal.
    //
    private stringLiteral(): void {
        while (true) {
            const ch = this.peek();
            if (ch === undefined) {
                // End of file!
                this.raiseError({
                    message: "Unterminated string literal.",
                    line: this.curTokenLine!,
                    column: this.curTokenColumn!,
                });
                break;
            }
            if (ch === "\n") {
                // End of file!
                this.raiseError({
                    message: "String literal was terminated by a new line.",
                    line: this.curTokenLine!,
                    column: this.curTokenColumn!,
                });
                break;
            }
            this.advance();
            if (ch === "\"") {
                break; // End of string literal.
            }
        }

        const value = this.code.substring(this.curTokenStart! + 1, this.curPosition - 1);

        this.setCurrent({ 
            type: TokenType.STRING, 
            value: value,
            line: this.curTokenLine!,
            column: this.curTokenColumn!,
            string: value,
        }); 
    }
}