//
// Tokenizer for the Aqua language.
//

export enum TokenType {
    PLUS,
    EOF             // Token injected at the end of the input.
}

//
// Represents a token.
//
export interface IToken {
    readonly type: TokenType;
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
    //
    readNext(): void {

        while (true) {
            this.skipWhitespace();

            if (this.isAtEnd()) {
                this.setCurrent({ type: TokenType.EOF });
                return;
            }
    
            const ch = this.advance();
            switch (ch) {
                case "+": {
                    this.setCurrent({ type: TokenType.PLUS }); 
                    return;
                }
    
                default: {
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
    // Returns true once all input has been consumed.
    //
    isAtEnd(): boolean {
        return this.curPosition >= this.code.length;
    }

}