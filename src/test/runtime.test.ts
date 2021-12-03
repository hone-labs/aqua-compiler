import dedent from "dedent";
import { execute } from "teal-interpreter";
import { compile } from "..";

describe("runtime tests", () => {

    it("stub", () => {
        // Stub to prevent error about zero tests.
    })

    it("1 + 2", async () => {
        const result = await execute(compile("return 1 + 2;"));
        expect(result.stack.length).toBe(1);
        expect(Number(result.stack[0].value)).toBe(3);
    });

    it("while loop", async () => {

        const result = await execute(compile(dedent(`
            let x = 0;
            while (x < 2) {
                x = x + 1;
            }
            return x;
        `)));
        
        expect(result.stack.length).toBe(1);
        expect(Number(result.stack[0].value)).toBe(2);
    });

    it("for loop", async () => {

        const result = await execute(compile(dedent(`
            let x = 0;
            for (let i = 0; i < 4; i = i + 1) {
                x = x + 1;
            }
            return x;
        `)));
        
        expect(result.stack.length).toBe(1);
        expect(Number(result.stack[0].value)).toBe(4);
    });
});