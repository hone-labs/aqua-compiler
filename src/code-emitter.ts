//
// Emits generated code.
//
export interface ICodeEmitter {

    // Adds a line of code to the output.
    //
    add(line: string, comment?: string): void;
}

export class CodeEmitter implements ICodeEmitter {

    //
    // Output collected by the code emitter.
    //
    private output: string[] = [];

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
    // Adds a line of code to the output.
    //
    add(code: string, comment?: string): void {
        if (this.debugMode && comment) {
            this.output.push(`${this.padString(code)} // ${comment}`);
        }
        else {
            this.output.push(code);
        }
    }

    //
    // Get lines of generate code.
    //
    getOutput(): string[] {
        return this.output;
    }
}