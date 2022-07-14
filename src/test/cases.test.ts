import * as path from "path";
import * as fs from "fs-extra";
import * as glob from "fast-glob";
import { Compiler, ICompilerOptions } from "..";

//
// Set to true to force an update of all output TEAL files.
//
const forceUpdate = false;

//
// Normalize whitespace so we don't have to consider it when testing.
//
function normalize(input: string): string {
    return input.split("\n")
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .join("\n");
}

describe("test cases", () => {

    //
    // Helper function to compile Aqua code to TEAL.
    //
    function compile(code: string, options?: ICompilerOptions): string {
        const compiler = new Compiler(options);
        const teal = compiler.compile(code);
        if (compiler.errors.length > 0) {
            console.error(`Found ${compiler.errors.length} errors.`);

            for (const error of compiler.errors) {
                console.error(`${error.line}:${error.column}: Error: ${error.message}`);
            }
        }    

        return teal;
    }

    const testCaseFiles = glob.sync([`${__dirname.replace(/\\/g, "/")}/cases/**/input.aqua`]);
    for (const testCaseFile of testCaseFiles) {
        const basename = path.basename(path.dirname(testCaseFile));
        const testName = `can compile ${basename}`;
        it(testName, async () => {
            const dirPath = path.dirname(testCaseFile);
            const tealFilePath = path.join(dirPath, "output.teal");
            const input = await fs.readFile(testCaseFile, "utf8");
            const compiled = normalize(compile(input, { disableVersionStamp: true }));
            if (!forceUpdate) {
                const outputFileExists = await fs.pathExists(tealFilePath);
                if (outputFileExists) {
                    const expected = normalize(await fs.readFile(tealFilePath, "utf8"));
                    if (compiled !== expected) {
                        console.log(`== ${testName} ==\r\nCompiled:\r\n"${compiled}"\r\n\r\nExpected:\r\n"${expected}"`);
                    }
                    expect(compiled).toEqual(expected);    
                    return;
                }
            }

            // Output file doesn't exist.
            console.log(`Writing ${tealFilePath} because it doesn't exist yet, don't forget to commit this file.`);
            await fs.writeFile(tealFilePath, compiled);
        });
    }
});