import { compile } from "..";
import dedent from "dedent";

//
// Normalize whitespace so we don't have to consider it when testing.
//
function normalize(input: string): string {
    return input.split("\n")
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .join("\n");
}

describe("statement", () => {

    //
    // Compile the input string and check it against the expected output.
    // 
    function check(input: string, expected: string): void {
        const teal = normalize(compile(input));
        const expectedTeal = normalize(expected);
        if (teal !== expectedTeal) {
            console.log(`Compiled:\r\n"${teal}"\r\nExpected:\r\n"${expectedTeal}"`);
        }
        expect(teal).toEqual(expectedTeal);
    }

    it("can't assign to a number", () => {
        expect(() => compile("1=1;")).toThrow();
    });

    it("can't access undefined variable", () => {
        expect(() => compile("a = 1;")).toThrow();
    });

    it("can't redefine variable", () => {
        expect(() => {
            compile(`
                var a;
                var a;
            `)
        }).toThrow();
    });

    it("must initialize a constant", () => {
        expect(() => compile("const a;")).toThrow();
    });

    it("can't redefine a constant", () => {
        expect(() => {
            compile(`
                const a = 1;
                a = 2;
            `)
        }).toThrow();
    });

    it("can declare a function with zero args", () => {
        check(
            dedent(`
                function myFunction() {
                    return 1;
                }
            `),
            dedent(`
                #pragma version 4
                int 256
                store 0
                b program_end
                myFunction:
                load 0
                load 0
                int 1
                -
                store 0
                load 0
                swap
                stores
                int 1
                retsub
                load 0
                loads
                store 0
                retsub
                program_end:
            `)
        );
    });

    it("can declare a function with one arg", () => {
        check(
            dedent(`
                function myFunction(a) {
                    return 1;
                }
            `),
            dedent(`
                #pragma version 4
                int 256
                store 0
                b program_end
                myFunction:
                load 0
                load 0
                int 2
                -
                store 0
                load 0
                swap
                stores
                int 1
                load 0
                +
                stores
                int 1
                retsub
                load 0
                loads
                store 0
                retsub
                program_end:
            `)
        );
    });

    it("can declare a function with multiple args", () => {
        check(
            dedent(`
                function myFunction(a, b, c) {
                    return 1;
                }
            `),
            dedent(`
                #pragma version 4
                int 256
                store 0
                b program_end
                myFunction:
                load 0
                load 0
                int 4
                -
                store 0
                load 0
                swap
                stores
                int 3
                load 0
                +
                stores
                int 2
                load 0
                +
                stores
                int 1
                load 0
                +
                stores
                int 1
                retsub
                load 0
                loads
                store 0
                retsub
                program_end:
            `)
        );
    });

    it("code for functions is moved to the end", () => {
        check(
            dedent(`
                const a = 1;
                function myFunction() {
                    return 1;
                }
                const b = 2;
            `),
            dedent(`
                #pragma version 4
                int 256
                store 0
                int 1
                store 1
                int 2
                store 2
                b program_end
                myFunction:
                load 0
                load 0
                int 1
                -
                store 0
                load 0
                swap
                stores
                int 1
                retsub
                load 0
                loads
                store 0
                retsub
                program_end:
            `)
        );
    });

    it("can declare multiple functions", () => {
        check(
            dedent(`
                function fn1() {
                    return 1;
                }
                function fn2() {
                    return 2;
                }
            `),
            dedent(`
                #pragma version 4
                int 256
                store 0
                b program_end
                fn1:
                load 0
                load 0
                int 1
                -
                store 0
                load 0
                swap
                stores
                int 1
                retsub
                load 0
                loads
                store 0
                retsub
                fn2:
                load 0
                load 0
                int 1
                -
                store 0
                load 0
                swap
                stores
                int 2
                retsub
                load 0
                loads
                store 0
                retsub
                program_end:
            `)
        );
    });
});
