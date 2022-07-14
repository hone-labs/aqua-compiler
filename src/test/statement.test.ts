import { Compiler } from "..";
import { IError } from "../error";

describe("statement", () => {

    function compile(code: string) {
        const compiler = new Compiler();
        compiler.compile(code);
        return {
            errors: compiler.errors,
        };
    }

    it("can handle unterminated function body", () => {
        const { errors } = compile("function main() {");

        expect(errors.length).toBe(1);
    });

    it("can't assign to a number", () => {
        const { errors } = compile("1=1;");

        expect(errors.length).toBe(1);
    });

    it("can't access undefined variable", () => {
        const { errors } = compile("a = 1;");

        expect(errors.length).toBe(1);
    });

    it("can't redefine variable", () => {
        const { errors } = compile(`
            let a;
            let a;
        `);

        expect(errors.length).toBe(1);
    });

    it("can't redefine a constant", () => {
        const { errors } = compile(`
            const a = 1;
            a = 2;
        `);

        expect(errors.length).toBe(1);
    });

});
