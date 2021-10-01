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

import { compile, parse } from ".";
import { Runtime, types, Interpreter } from "./algo-builder/packages/runtime";

const fs = require("fs/promises");
const minimist = require("minimist");
const readline = require('readline');

async function main() {

    const argv = minimist(process.argv.slice(2));
    const numArgs = argv._.length;

    if (numArgs > 0) {
        const command = recogniseCommand(argv._);
        if (command !== null) {
            if (numArgs.length === 1) {
                throw new Error(`Not enough arguments, please specify Aqua file.`);
            }
        }
        
        const filePath = argv._.shift();

        // Compile a file.
        const fileData = await fs.readFile(filePath, "utf8");
        if (command === "exec") {
            console.log(`== TEAL ==`);
            const teal = compile(fileData);
            console.log(teal);

            // Execute the file directly.
            console.log(`\r\n== EVALUATION ==`);
            const result = execute(teal);

            console.log(`\r\n== RESULT ==`);
            console.log(result);
        }
        else if (command === "ast") {
            // Parse and dump AST.
            console.log(`== AST ==`);
            const ast = parse(fileData);
            console.log(JSON.stringify(ast, null, 4));
        }
        else {
            // Print compiled output.
            console.log(compile(fileData));
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
// Gets a command if one is found in the arguments.
//
function recogniseCommand(args: string[]): string | undefined {
    if (args[0] === "exec" || args[0] === "ast") {
        return args.shift();
    }

    return undefined;
}

//
// Execute the input TEAL code in the interpreter.
//
function execute(teal: string): any {
    const runtime = new Runtime([]);
    const interpreter = new Interpreter();
    return interpreter.execute(teal, types.ExecutionMode.APPLICATION, runtime, undefined);
}