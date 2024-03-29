//
// CLI entry point for the Aqua compiler.
//
// Usage:
//
//    aqua 
//
//      npx ts-node -T ./src/cli.js exec test.aqua     => Runs the file using the built in interpretter.
//      npx ts-node -T ./src/cli.js test.aqua          => Compiles to TEAL.    
//      npx ts-node -T ./src/cli.js                    => Runs the REPL.
//
// Or:
//
//      npx ts-node -T ./src/cli.js exec test.aqua     => Runs the file using the built in interpretter.
//      npx ts-node -T ./src/cli.js test.aqua          => Compiles to TEAL.    
//      npx ts-node -T ./src/cli.js                    => Runs the REPL.
//

import { execute } from "teal-interpreter";
import { compile, ICompilerOptions } from ".";
import { parse } from "./parser";

const packageJson = require("../package.json");
const fs = require("fs-extra");
const minimist = require("minimist");
const readline = require('readline');
const colorJson = require('color-json');

async function main() {

    const argv = minimist(process.argv.slice(2));
    const numArgs = argv._.length;

    if (argv.version) {
        console.log(`Aqua version: ${packageJson.version}`);
        return;
    }

    if (numArgs > 0) {
        const command = recogniseCommand(argv._);
        if (command !== null) {
            if (numArgs.length === 1) {
                throw new Error(`Not enough arguments, please specify Aqua file.`);
            }
        }
        
        const filePath = argv._.shift();

        // Compile a file.
        const aquaCode = await fs.readFile(filePath, "utf8");
        if (command === "exec") {
            console.log(`== TEAL ==`);

            const tealCode = compile(aquaCode);
            if (tealCode !== undefined) {
                console.log(tealCode.split("\n")
                    .map((line, index) => `${index+1}: ${line}`)
                    .join("\n")
                );
    
                // Execute the file directly.
                console.log(`\r\n== EVALUATION ==`);
                const result = await execute(tealCode);
    
                console.log(`\r\n== RESULT ==`);
                console.log(result);
            }
        }
        else if (command === "ast") {
            // Parse and dump AST.
            console.log(`== AST ==`);
            const ast = parse(aquaCode, err => {
                console.error(`${err.line}:${err.column}: Error: ${err.message}`);
            });
            console.log(colorJson(ast));
        }
        else {
            const options: ICompilerOptions = {
                outputComments: !!argv.comments,
            };
            
            const tealCode = compile(aquaCode, options);
            if (tealCode !== undefined) {
                // Print compiled output.
                console.log(tealCode);
            }
        }
    }
    else {
        // REPL.
        var repl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
            terminal: false
        });

        process.stdout.write("% ");
        
        repl.on('line', (text: string) => {
            text = text.trim();

            if (text === "exit" || text === "quit") {
                process.exit(0);
            }
            
            //
            // Compiles and prints the line of code.
            //
            // Automatically adds a semi-colon so the user doesn't need to add one.
            // Double semi-colons (i.e. empty statements) are handled by the parser.
            //
            try {
                const tealCode = compile(text + ";");
                console.log(tealCode); 
            }
            catch (err: any) {
                console.error(err.message);
            }

            process.stdout.write("% ");
        });        
    }
}

main()
    .catch(err => {
        console.error("An error occurred:");
        console.error(err && err.stack || err);
    });

//
// Gets a command if one is found in the arguments.
//
function recogniseCommand(args: string[]): string | undefined {
    if (args[0] === "exec" || args[0] === "ast") {
        return args.shift();
    }

    return undefined;
}