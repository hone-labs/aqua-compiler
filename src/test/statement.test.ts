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

    it("can compile an expression statement", ()  => {

        check(
            "1 + 1 ;",
            dedent(`
                #pragma version 3
                int 1
                int 1
                +
            `)
        );
    });

    it("can compile a return statement", ()  => {

        check(
            "return 1 ;",
            dedent(`
                #pragma version 3   
                int 1
                return
            `)
        );
    });

    it("can compile multiple statements", ()  => {

        check(
            "1 + 2 ; return 3 ;",
            dedent(`
                #pragma version 3
                int 1
                int 2
                +
                int 3
                return
            `)
        );
    });

    it("can declare and use a variable", ()  => {

        check(
            dedent(`
                var x = 2;
                return x > 3;
            `),
            dedent(`
                #pragma version 3
                int 2
                store 0
                load 0
                int 3
                >
                return
            `)
        );
    });

    it("can compile if statement", () => {

        check(
            dedent(`
                if (2 > 1) {
                    return 5;
                }
                else {
                    return 10;
                }
            `),
            dedent(`
                #pragma version 3
                int 2
                int 1
                >
                bz else-1
                int 5
                return
                b end-1
                else-1:
                int 10
                return
                end-1:            
            `)
        );
    });

    it("can compile if statement with no else block", () => {

        check(
            dedent(`
                if (2 > 1) {
                    return 5;
                }
            `),
            dedent(`
                #pragma version 3
                int 2
                int 1
                >
                bz else-1
                int 5
                return
                b end-1
                else-1:
                end-1:            
            `)
        );
    });

    it("can compile an assignment", () => {
        check(
            dedent(`
                var a;
                a = 3;
            `),
            dedent(`
                #pragma version 3
                int 3
                store 0
            `)
        );
    });

    it("empty statements are allowed", () => {
        check(
            dedent(`
                ;
                  ;  
            `),
            dedent(`
                #pragma version 3
            `)
        );
    });

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

});
