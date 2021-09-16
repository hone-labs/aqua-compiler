import { compile, genCode } from "..";
import * as dedent from "dedent";

//
// Normalize whitespace so we don't have to consider it when testing.
//
function normalize(input: string): string {
    return input.split("\n").map(line => line.trim()).join("\n");
}

describe("aqua-compiler", () => {

    it("can compile an addition expression", ()  => {

        const teal = normalize(compile("1 + 1"));
        const expectedTeal = normalize(dedent(`
            int 1
            int 1
            +
        `));
        expect(teal).toEqual(expectedTeal);
    });

    it("can compile an subtraction expression", ()  => {

        const teal = normalize(compile("1 - 1"));
        const expectedTeal = normalize(dedent(`
            int 1
            int 1
            -
        `));
        expect(teal).toEqual(expectedTeal);
    });

    it("can compile an multiplication expression", ()  => {

        const teal = normalize(compile("1 * 1"));
        const expectedTeal = normalize(dedent(`
            int 1
            int 1
            *
        `));
        expect(teal).toEqual(expectedTeal);
    });

    it("can compile an division expression", ()  => {

        const teal = normalize(compile("1 / 1"));
        const expectedTeal = normalize(dedent(`
            int 1
            int 1
            /
        `));
        expect(teal).toEqual(expectedTeal);
    });

    it("can compile a parenthesized expression", ()  => {

        const teal = normalize(compile("( 1 + 1 )"));
        const expectedTeal = normalize(dedent(`
            int 1
            int 1
            +
        `));
        expect(teal).toEqual(expectedTeal);
    });

    it("addition is left associative", () => {

        const teal = normalize(compile("1+2+3"));
        const expectedTeal = normalize(dedent(`
            int 1
            int 2
            +
            int 3
            +
        `));

        expect(teal).toEqual(expectedTeal);
    });

    it("subtraction is left associative", () => {

        const teal = normalize(compile("1-2-3"));
        const expectedTeal = normalize(dedent(`
            int 1
            int 2
            -
            int 3
            -
        `));

        expect(teal).toEqual(expectedTeal);
    });

    it("can mix addition and subtaction", () => {

        const teal = normalize(compile("1+2-3"));
        const expectedTeal = normalize(dedent(`
            int 1
            int 2
            +
            int 3
            -
        `));

        expect(teal).toEqual(expectedTeal);
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
