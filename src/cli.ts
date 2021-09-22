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

import { compile } from ".";
import { Runtime, types, Interpreter } from "../algo-builder/packages/runtime";

const fs = require("fs/promises");
const minimist = require("minimist");
const readline = require('readline');

async function main() {

    const argv = minimist(process.argv.slice(2));
    const numArgs = argv._.length;

    if (numArgs > 0) {
        let filePath: string;
        const exec = argv._[0] === "exec";
        if (exec) {
            if (numArgs.length === 1) {
                throw new Error(`Not enough arguments, please specify file to execute.`);
            }

            filePath = argv._[1];
        }
        else {
            filePath = argv._[0];
        }

        // Compile a file.
        const fileData = await fs.readFile(filePath, "utf8");
        const teal = compile(fileData);
        if (exec) {
            console.log(`== TEAL ==`);
            console.log(teal);

            // Execute the file directly.
            console.log(`\r\n== EVALUATION ==`);
            execute(teal);
        }
        else {
            // Print compiled output.
            console.log(teal);
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
            console.log(compile(text.trim()));

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
// Execute the input TEAL code in the interpreter.
//
function execute(teal: string) {
    const runtime = new Runtime([]);
    const interpreter = new Interpreter();
    interpreter.execute(teal, types.ExecutionMode.APPLICATION, runtime, 10);
}