import * as path from "path";
import * as fs from "fs";
import { compile } from "..";
import * as glob from "fast-glob";

describe("test cases", () => {

    const testCaseFiles = glob.sync(path.join(__dirname, "cases/**/input.aqua"));
    for (const testCaseFile of testCaseFiles) {
        const basename = path.basename(testCaseFile, ".aqua");
        it(`can compile ${basename}`, async () => {
            const dirPath = path.dirname(testCaseFile);
            const tealFilePath = path.join(dirPath, "output.teal");
            const input = await fs.promises.readFile(testCaseFile, "utf8");
            const compiled = compile(input);
            const expected = await fs.promises.readFile(tealFilePath, "utf8");
            if (compiled !== expected) {
                console.log(`Compiled:\r\n"${compiled}"\r\nExpected:\r\n"${expected}"`);
            }
            expect(compiled).toEqual(expected);    
        });
    }
});