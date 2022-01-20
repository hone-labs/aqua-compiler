//
// Tokenizer for the Aqua language.
//

export enum TokenType {
    EOF, // Token injected at the end of the input.
    PLUS,
    NUMBER,
    SEMICOLON,    
}

export const TOKEN_NAME = [
    "end-of-file",
    "+",
    "number",
    "semicolon",
];

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
}

//
// Interface for reporting errors.
//
export interface IError {
    //
    // The error message.
    //
    msg: string;
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
    // The position in the code where the current token starts.
    //
    private curTokenStart?: number;

    //
    // The most recently scannned token.
    //
    private curToken?: IToken;

    //
    // A simple interface that allows the tokenizer to report an error and continue scanning.
    //
    private onError?: (err: IError) => void;

    constructor(code: string, onError?: (err: IError) => void) {
        this.code = code;
        this.curPosition = 0;
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
                this.setCurrent({ type: TokenType.EOF });
                return;
            }

            this.curTokenStart = this.curPosition;
    
            const ch = this.advance();
            switch (ch) {
                case "+": {
                    this.setCurrent({ type: TokenType.PLUS }); 
                    return;
                }

                case ";": {
                    this.setCurrent({ type: TokenType.SEMICOLON }); 
                    return;
                }
    
                default: {
                    if (this.isDigit(ch)) {
                        this.readNumber();
                        return;
                    }

                    if (this.onError) {
                        this.onError({
                            msg: `Encountered unexpected character ${ch}`,
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
    // Sets the current token.
    //
    private setCurrent(token: IToken) {
        this.curToken = token;
    }

    //
    // Return the current character and then advance the current position by one place.
    //
    private advance(): string {
        return this.code[this.curPosition++];
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
            const ch = this.code[this.curPosition];
            if (ch === " " || ch === "\t" || ch === "\r" || ch === "\n") {
                this.curPosition += 1;
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

        this.setCurrent({ 
            type: TokenType.NUMBER, 
            value: parseFloat(this.code.substring(this.curTokenStart!, this.curPosition)),
        }); 
    }
}