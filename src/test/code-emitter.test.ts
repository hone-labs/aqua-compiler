import { CodeEmitter } from "../code-emitter";

describe("code emitter", () => {

    it("has nothing in output then now code is added", () => {

        const codeEmitter = new CodeEmitter(false);
        expect(codeEmitter.getOutput()).toEqual([]);
    });

    it("can output code that has been added", () => {

        const codeEmitter = new CodeEmitter(false);
        codeEmitter.add(`A`);
        codeEmitter.add(`B`);
        expect(codeEmitter.getOutput()).toEqual([`A`, `B`]);
    });

});