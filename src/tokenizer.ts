//
// Tokenizer for the Aqua language.
//

export enum TokenType {
    EOF,
    PLUS,
    NUMBER,
    SEMICOLON,
    CONST,
    LET,
    ASSIGNMENT,
    IDENTIFIER,
    OPEN_PAREN,
    CLOSE_PAREN,
    OPEN_BRACKET,
    CLOSE_BRACKET,
    FUNCTION,
}

//
// Maps TokenType to the name of each type of token.
//
export const TOKEN_NAME = [
    "end-of-file",
    "+",
    "number",
    "semicolon",
    "const",
    "let",
    "=",
    "identifier",
    "(",
    ")",
    "{",
    "}",
    "function",
];

//
// Maps a string of characters to a TokenType.
//
export const KEYWORDS = {
    const: TokenType.CONST,
    let: TokenType.LET,
    function: TokenType.FUNCTION,
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
// Interface for reporting errors.
//
export interface IError {
    //
    // The error message.
    //
    msg: string;

    //
    // 1-based line number where the error occurred.
    //
    line: number;

    //
    // 0-based column number where the error occurred.
    //
    column: number;
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
// Defines a handler for errors.
//
export type OnErrorFn = (err: IError) => void;

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
            switch (ch) {
                case "+": {
                    this.setCurrent({ 
                        type: TokenType.PLUS,
                        line: this.curTokenLine,
                        column: this.curTokenColumn,
                        string: "+",
                    }); 
                    return;
                }

                case ";": {
                    this.setCurrent({ 
                        type: TokenType.SEMICOLON,
                        line: this.curTokenLine,
                        column: this.curTokenColumn,
                        string: ";",
                    }); 
                    return;
                }

                case "=": {
                    this.setCurrent({ 
                        type: TokenType.ASSIGNMENT,
                        line: this.curTokenLine,
                        column: this.curTokenColumn,
                        string: "=",
                    }); 
                    return;
                }

                case "(": {
                    this.setCurrent({ 
                        type: TokenType.OPEN_PAREN,
                        line: this.curTokenLine,
                        column: this.curTokenColumn,
                        string: "(",
                    }); 
                    return;
                }
                
                case ")": {
                    this.setCurrent({ 
                        type: TokenType.CLOSE_PAREN,
                        line: this.curTokenLine,
                        column: this.curTokenColumn,
                        string: ")",
                    }); 
                    return;
                }

                case "{": {
                    this.setCurrent({ 
                        type: TokenType.OPEN_BRACKET,
                        line: this.curTokenLine,
                        column: this.curTokenColumn,
                        string: "{",
                    }); 
                    return;
                }
                
                case "}": {
                    this.setCurrent({ 
                        type: TokenType.CLOSE_BRACKET,
                        line: this.curTokenLine,
                        column: this.curTokenColumn,
                        string: "}",
                    }); 
                    return;
                }

                default: {
                    if (this.isDigit(ch)) {
                        this.readNumber();
                        return;
                    }

                    if (this.isAlpha(ch)) {
                        this.readIdentifer();
                        return;
                    }

                    if (this.onError) {
                        this.onError({
                            msg: `Encountered unexpected character ${ch}`,
                            line: this.curTokenLine,
                            column: this.curTokenColumn,
                        });
                    }

                    // Error reported, now continue scanning at the next character.
                    break;
                }
            }
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
    private readNumber() {
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
    private readIdentifer() {
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

}