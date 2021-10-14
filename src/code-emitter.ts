//
// Emits generated code.
//

//
// An element of generated code.
//
export interface ICodeElement {

    //
    // The code for this element.
    //
    readonly code: string;

    //
    // Optional debug comment that explains this element of code.
    //
    readonly comment?: string;
}

//
// A block of tagged coded.
//
export interface ICodeBlock {

    //
    // Elements of code emitted to the block.
    //
    readonly elements: ICodeElement[];

    //
    // Tags assigned to the block.
    //
    readonly tags: string[];

}

export interface ICodeEmitter {

    //
    // Starts a tagged block of code.
    //
    startBlock(code: string): void;

    //
    // Ends a tagged block of code.
    //
    endBlock(): void;

    //
    // Adds a line of code to the output.
    //
    add(line: string, comment?: string): void;
}

export class CodeEmitter implements ICodeEmitter {

    //
    // The current block of code.
    //
    private curBlock?: ICodeBlock = undefined;

    //
    // Emitted blocks of code.
    //
    private output: ICodeBlock[] = [];

    //
    // Tags for the current block of ocde.
    //
    private tagStack: string[] = [];

    constructor(private debugMode: boolean) {
    }

    //
    // Pad a string to the specific size.
    //
    private padString(input: string): string {
        const padColumn = 40;
        if (input.length < padColumn) {
            return input + " ".repeat(padColumn - input.length);
        }

        return input;
    }

    //
    // Allocates a new block of code.
    //
    private allocateNewBlock() {
        this.curBlock = {
            elements: [],
            tags: this.tagStack.slice(0), // Clone tags.
        }
        this.output.push(this.curBlock);
    }

    //
    // Starts a tagged block of code.
    //
    startBlock(tag: string): void {
        this.tagStack.push(tag);
        this.allocateNewBlock();        
    }

    //
    // Ends a tagged block of code.
    //
    endBlock(): void {
        this.tagStack.pop();
        this.allocateNewBlock();
    }

    //
    // Adds a line of code to the output.
    //
    add(code: string, comment?: string): void {
        if (!this.curBlock) {
            // Start first block automatically.
            this.allocateNewBlock();
        }

        this.curBlock!.elements.push({
            code: code,
            comment: comment,
        })
        }

    //
    // Retrieve blocks of generated code.
    //
    getBlock(): ICodeBlock[] {
        return this.output;
    }

    //
    // Get lines of generate code.
    //
    getOutput(): string[] {
        return this.output.flatMap(block => block.elements).map(element => {
            if (this.debugMode && element.comment) {
                return `${this.padString(element.code)} // ${element.comment}`;
            }
            else {
                return element.code;
            }
        });
    }
}