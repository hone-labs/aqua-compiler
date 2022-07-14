import dedent from "dedent";
import { execute } from "teal-interpreter";
import { Compiler, ICompilerOptions } from "..";

describe("runtime tests", () => {

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

    it("1 + 2", async () => {
        const result = await execute(compile("return 1 + 2;"));
        expect(result.stack.length).toBe(1);
        expect(Number(result.stack[0].value)).toBe(3);
    });

    it("while loop", async () => {

        const result = await execute(compile(dedent(`
            let x = 0;
            while (x < 2) {
                x = x + 1;
            }
            return x;
        `)));
        
        expect(result.stack.length).toBe(1);
        expect(Number(result.stack[0].value)).toBe(2);
    });

    it("for loop", async () => {

        const result = await execute(compile(dedent(`
            let x = 0;
            for (let i = 0; i < 4; i = i + 1) {
                x = x + 1;
            }
            return x;
        `)));
        
        expect(result.stack.length).toBe(1);
        expect(Number(result.stack[0].value)).toBe(4);
    });
});