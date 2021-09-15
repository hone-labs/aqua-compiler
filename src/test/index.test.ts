import { compile, genCode } from "..";
import * as dedent from "dedent";

//
// Normalize whitespace so we don't have to consider it when testing.
//
function normalize(input: string): string {
    return input.split("\n").map(line => line.trim()).join("\n");
}

describe("aqua-compiler", () => {

    it("can compile an expression", ()  => {

        const teal = normalize(compile("1+1"));
        const expectedTeal = normalize(dedent(`
            int 1
            int 1
            +
        `));
    });

});
