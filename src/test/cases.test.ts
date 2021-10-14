import * as path from "path";
import * as fs from "fs";
import { compile } from "..";
import * as glob from "fast-glob";

//
// Normalize whitespace so we don't have to consider it when testing.
//
function normalize(input: string): string {
    return input.split("\n").map(line => line.trim()).join("\n");
}

describe("test cases", () => {

    const testCaseFiles = glob.sync([`${__dirname.replace(/\\/g, "/")}/cases/**/input.aqua`]);
    for (const testCaseFile of testCaseFiles) {
        const basename = path.basename(path.dirname(testCaseFile));
        const testName = `can compile ${basename}`;
        it(testName, async () => {
            const dirPath = path.dirname(testCaseFile);
            const tealFilePath = path.join(dirPath, "output.teal");
            const input = await fs.promises.readFile(testCaseFile, "utf8");
            const compiled = normalize(compile(input));
            const expected = normalize(await fs.promises.readFile(tealFilePath, "utf8"));
            if (compiled !== expected) {
                console.log(`== ${testName} ==\r\nCompiled:\r\n"${compiled}"\r\n\r\nExpected:\r\n"${expected}"`);
            }
            expect(compiled).toEqual(expected);    
        });
    }
});