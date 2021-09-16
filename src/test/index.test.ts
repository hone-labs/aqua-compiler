import { compileExpression, genCode } from "..";
import * as dedent from "dedent";

//
// Normalize whitespace so we don't have to consider it when testing.
//
function normalize(input: string): string {
    return input.split("\n").map(line => line.trim()).join("\n");
}

describe("aqua-compiler", () => {

    //
    // Compile the input string and check it against the expected output.
    // 
    function check(input: string, expected: string): void {
        const teal = normalize(compileExpression(input));
        const expectedTeal = normalize(expected);
        expect(teal).toEqual(expectedTeal);
    }

    it("can compile an addition expression", ()  => {

        check(
            "1 + 1", 
            dedent(`
                int 1
                int 1
                +
            `)
        );
    });

    it("can compile an subtraction expression", ()  => {

        check(
            "1 - 1",
            dedent(`
                int 1
                int 1
                -
            `)
        );
    });

    it("can compile an multiplication expression", ()  => {

        check(
            "1 * 1",
            dedent(`
                int 1
                int 1
                *
            `)
        );
    });

    it("can compile an division expression", ()  => {

        check(
            "1 / 1",
            dedent(`
                int 1
                int 1
                /
            `)
        );
    });

    it("can compile a parenthesized expression", ()  => {

        check(
            "( 1 + 1 )",
            dedent(`
                int 1
                int 1
                +
            `)
        );
    });

    it("addition is left associative", () => {

        check(
            "1+2+3",
            dedent(`
                int 1
                int 2
                +
                int 3
                +
            `)
        );
    });

    it("subtraction is left associative", () => {

        check(
            "1-2-3",
            dedent(`
                int 1
                int 2
                -
                int 3
                -
            `)
        );
    });

    it("can mix addition and subtraction", () => {

        check(
            "1+2-3",
            dedent(`
                int 1
                int 2
                +
                int 3
                -
            `)
        );
    });

    it("multiplication is left associative", () => {

        check(
            "1*2*3",
            dedent(`
                int 1
                int 2
                *
                int 3
                *
            `)
        );
    });

    it("division is left associative", () => {

        check(
            "1/2/3",
            dedent(`
                int 1
                int 2
                /
                int 3
                /
            `)
        );
    });

    it("can mix multiplication and division", () => {

        check(
            "1*2/3",
            dedent(`
                int 1
                int 2
                *
                int 3
                /
            `)
        );
    });

    it("can generate code for operator", () => {

        const opcode = "test-opcode";
        const node = {
            nodeType: "operator",
            opcode: opcode,
        };
        const output: string[] = [];
        genCode(node, output);
        
        expect(output).toEqual([
            opcode,
        ]);
    });

    it("can generate code for children", () => {

        const opcode = "test-opcode";
        const child1 = {
            nodeType: "operator",
            opcode: opcode + "-child-1",
        };
        const child2 = {
            nodeType: "operator",
            opcode: opcode + "-child-2",
        };
        const node = {
            nodeType: "operator",
            opcode: opcode + "-parent",
            children: [
                child1,
                child2,
            ],
        };
        const output: string[] = [];
        genCode(node, output);
        
        expect(output).toEqual([
            `${opcode}-child-1`,
            `${opcode}-child-2`,
            `${opcode}-parent`,
        ]);
    });

    it("can generate code for literal", () => {

        const opcode = "test-opcode";
        const value = "1234";
        const node = {
            nodeType: "literal",
            opcode: opcode,
            value: value,
        };
        const output: string[] = [];
        genCode(node, output);
        
        expect(output).toEqual([
            `${opcode} ${value}`,
        ]);
    });    
});
