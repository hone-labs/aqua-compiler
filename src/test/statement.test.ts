import * as aqua from "..";
import { IError } from "../error";

describe("statement", () => {

    let errors: IError[] = []

    beforeEach(() => {
        errors = [];
    });

    function compile(code: string): void {
        aqua.compile(code, err => { errors.push(err); });
    }

    it("can handle unterminated function body", () => {
        compile("function main() {");

        expect(errors.length).toBe(1);
    });

    it("can't assign to a number", () => {
        compile("1=1;");

        expect(errors.length).toBe(1);
    });

    it("can't access undefined variable", () => {
        compile("a = 1;");

        expect(errors.length).toBe(1);
    });

    it("can't redefine variable", () => {
        compile(`
            let a;
            let a;
        `);

        expect(errors.length).toBe(1);
    });

    it("can't redefine a constant", () => {
        compile(`
            const a = 1;
            a = 2;
        `);

        expect(errors.length).toBe(1);
    });

});
