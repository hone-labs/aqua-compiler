const parser = require("./parser");
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
        
        repl.on('line', text => {
            console.log(compile(text));

            process.stdout.write("% ");
        });        
    }
}

function compile(input) {
    const ast = parser.parse(input);

    const output = [];
    genCode(ast, output);

    return output.join("\r\n");
}

function genCode(node, output) {

    if (node.children) {
        for (const child of node.children) {
            genCode(child, output);
        }
    }

    if (node.nodeType === "operator") {
        output.push(node.opcode);
    }
    else if (node.nodeType === "literal") {
        output.push(`${node.opcode} ${node.value}`);
    }
    else {
        throw new Error(`Unexpected node type ${node.nodeType}`);
    }
}

main()
    .catch(err => {
        console.error("An error occurred:");
        console.error(err && err.stack || err);
    });