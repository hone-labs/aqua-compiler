import * as aqua from "..";

describe("statement", () => {

    let numErrors = 0;

    beforeEach(() => {
        numErrors = 0;
    });

    function compile(code: string): void {
        aqua.compile(code, () => { numErrors += 1 });
    }

    it("can handle unterminated function body", () => {
        compile("function main() {");

        expect(numErrors).toBe(1);
    });

    it("can't assign to a number", () => {
        expect(() => compile("1=1;")).toThrow();
    });

    it("can't access undefined variable", () => {
        expect(() => compile("a = 1;")).toThrow();
    });

    it("can't redefine variable", () => {
        compile(`
            let a;
            let a;
        `);

        expect(numErrors).toBe(1);
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
