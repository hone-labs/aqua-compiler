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
import { Runtime, types, Interpreter } from "@algo-builder/runtime";

const fs = require("fs/promises");
const minimist = require("minimist");
const readline = require('readline');
const colorJson = require('color-json');

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
            console.log(colorJson(ast));
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

//
// Execute the input TEAL code in the interpreter.
//
function execute(teal: string): any {
    const runtime = new Runtime([]);
    const interpreter = new Interpreter();
    //TODO: This no longer works. Need to submit a PR so that I can retrieve the result of the exec.
    return interpreter.execute(teal, types.ExecutionMode.APPLICATION, runtime, undefined);
}