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

});
