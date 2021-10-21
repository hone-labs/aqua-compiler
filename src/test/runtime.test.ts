import dedent from "dedent";
import { compile } from "..";
import { execute } from "../exec";

describe("runtime tests", () => {

    it("stub", () => {
        // Stub to prevent error about zero tests.
    })

    // // TODO: Enable this code once PR is accepted with algo-builder/runtime.
    // it("1 + 2", () => {
    //     const result = execute(compile("return 1 + 2;"));
    //     expect(Number(result)).toBe(3);
    // });

    // it("while loop", () => {

    //     const result = execute(compile(dedent(`
    //         let x = 0;
    //         while (x < 2) {
    //             x = x + 1;
    //         }
    //         return x;
    //     `)));
        
    //     expect(Number(result)).toBe(2);
    // });

    // it("for loop", () => {

    //     const result = execute(compile(dedent(`
    //         let x = 0;
    //         for (let i = 0; i < 4; i = i + 1) {
    //             x = x + 1;
    //         }
    //         return x;
    //     `)));
        
    //     expect(Number(result)).toBe(4);
    // });
});