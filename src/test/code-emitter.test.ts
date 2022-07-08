import { CodeEmitter } from "../code-emitter";

describe("code emitter", () => {

    it("has nothing in output then now code is added", () => {

        const codeEmitter = new CodeEmitter(false);
        expect(codeEmitter.getOutput()).toEqual([]);
    });

    it("can output code that has been added", () => {

        const codeEmitter = new CodeEmitter(false);
        codeEmitter.add(`A`, 0, 0);
        codeEmitter.add(`B`, 0, 0);
        expect(codeEmitter.getOutput()).toEqual([`A`, `B`]);
    });

    it("emitting an instruction can add to stack", () => {

        const codeEmitter = new CodeEmitter(false);
        codeEmitter.add(`X`, 1, 0);
        expect(codeEmitter.getStackSize()).toBe(1);
    });

    it("emitting an instruction can remove from stack", () => {

        const codeEmitter = new CodeEmitter(false);
        codeEmitter.add(`X`, 1, 0);
        codeEmitter.add(`X`, 0, 1);
        expect(codeEmitter.getStackSize()).toBe(0);
    });

    it("emitting an instruction can add to and remove from stack", () => {

        const codeEmitter = new CodeEmitter(false);
        codeEmitter.add(`X`, 1, 1);
        expect(codeEmitter.getStackSize()).toBe(0);
    });

    it("can reset the stack", () => {

        const codeEmitter = new CodeEmitter(false);
        codeEmitter.add(`X`, 1, 0);
        codeEmitter.resetStack();
        expect(codeEmitter.getStackSize()).toBe(0);
    });
});