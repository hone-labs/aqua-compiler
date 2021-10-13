//
// Emits generated code.
//

export interface ICodeEmitter {
    //
    // Adds a line of code to the output.
    //
    add(line: string, debugComment?: string): void;
}

export class CodeEmitter implements ICodeEmitter {

    //
    // Emitted code.
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
    add(line: string, debugComment?: string): void {
        if (this.debugMode && debugComment) {
            this.output.push(`${this.padString(line)} // ${debugComment}`);
        }
        else {
            this.output.push(line);
        }
    }

    //
    // Retrieve generated code.
    //
    getOutput(): string[] {
        return this.output;
    }

}