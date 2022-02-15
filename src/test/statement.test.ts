import { compile } from "..";

describe("statement", () => {

    it("can't assign to a number", () => {
        expect(() => compile("1=1;")).toThrow();
    });

    it("can't access undefined variable", () => {
        expect(() => compile("a = 1;")).toThrow();
    });

    it("can't redefine variable", () => {
        expect(() => {
            compile(`
                let a;
                let a;
            `)
        }).toThrow();
    });

    it("can't redefine a constant", () => {
        expect(() => {
            compile(`
                const a = 1;
                a = 2;
            `)
        }).toThrow();
    });

});
