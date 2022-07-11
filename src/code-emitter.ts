export interface IInstruction {
    //
    // The code emitted for the instruction.
    //
    code: string;

    //
    // The comment to add to the code, if enabled.
    //
    comment?: string;

    //
    // The number of items added to the stack by this instruction.
    //
    numItemsAdded: number;

    //
    // The number of items removed from the stack by this instruction.
    //
    numItemsRemoved: number;

    //
    // The number of items on the stack before this instruction executes.
    //
    numItemsOnStackBefore: number;

    //
    // The number of items on the stack after this instruction executes.
    //
    numItemsOnStackAfter: number;
}

//
// Emits generated code.
//
export interface ICodeEmitter {

    //
    // Resets the emitter knowledge of the stack to zero.
    //
    resetStack(): void;

    //
    // Gets the current stack size.
    //
    getStackSize(): number;

    // Adds a line of code to the output.
    //
    add(line: string, numItemsAdded: number, numItemsRemoved: number, comment?: string): void;

    //
    // Starts a new section in the generated code.
    //
    section(comment?: string): void;

    //
    // Labels forth coming code.
    //
    label(labelName: string, comment?: string): void;

    //
    // Emits code to pop all items that have been pushed on the stack.
    //
    popAll(): void;    

    //
    // Generated an id for use with control statements, etc.
    //
    genId(): number;
}

export class CodeEmitter implements ICodeEmitter {

    //
    // Code that has been emitted.
    //
    private output: IInstruction[] = [];

    //
    // The number of items presently known to be on the stack.
    //
    private numItemsOnStack = 0;

    //
    // Used to generate unique IDs for control statements.
    //
    private controlStatementId = 0;

    //
    // Resets the emitter knowledge of the stack to zero.
    //
    resetStack(): void {
        this.numItemsOnStack = 0;
    }

    //
    // Gets the current stack size.
    //
    getStackSize(): number {
        return this.numItemsOnStack;
    }

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
    add(code: string, numItemsAdded: number, numItemsRemoved: number, comment?: string): void {
        this.output.push({
            code,
            comment,
            numItemsAdded,
            numItemsRemoved,
            numItemsOnStackBefore: this.numItemsOnStack,
            numItemsOnStackAfter: this.numItemsOnStack + numItemsAdded -  numItemsRemoved,
        });
        this.numItemsOnStack += numItemsAdded;
        this.numItemsOnStack -= numItemsRemoved;

        if (this.numItemsOnStack < 0) {
            throw new Error(`Now have negative items on the stack, this should not be possible.`);
        }
    }

    //
    // Starts a new section in the generated code.
    //
    section(comment?: string): void {
        this.add(``, 0, 0, comment);
    }

    //
    // Labels forth coming code.
    //
    label(labelName: string, comment?: string): void {
        this.add(`${labelName}:`, 0, 0, comment);
    }

    //
    // Get lines of generate code.
    //
    getOutput(): string[] {
        return this.output.map(instruction => {
            // Useful debugging code:
            // return `${this.padString(instruction.code)} // BEFORE: ${instruction.numItemsOnStackBefore}, AFTER: ${instruction.numItemsOnStackAfter}`;


            if (this.debugMode && instruction.comment) {
                return `${this.padString(instruction.code)} // ${instruction.comment}`
            }
            else {
                return instruction.code;
            }
        });
    }

    //
    // Emits code to pop all items that have been pushed on the stack.
    //
    popAll(): void {

        while (this.numItemsOnStack > 0) {
            this.add(`pop`, 0, 1, `Popping all items.`);
        }
    }

    //
    // Generated an id for use with control statements, etc.
    //
    genId(): number {
        this.controlStatementId += 1;
        return this.controlStatementId;
    }

}