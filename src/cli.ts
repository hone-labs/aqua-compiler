import { compile } from ".";

const fs = require("fs/promises");
const minimist = require("minimist");
const readline = require('readline');

async function main() {

    const argv = minimist(process.argv.slice(2));

    const filePath = argv._.length > 0 && argv._[0];
    if (filePath) {
        // Compile a file.
        const fileData = await fs.readFile(filePath, "utf8");
        const output = compile(fileData);
        console.log(output);
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