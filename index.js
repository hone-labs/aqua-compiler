const parser = require("./parser");
const fs = require("fs/promises");

async function main() {

    const fileData = await fs.readFile("./test.tl", "utf8");
    console.log("Input:");
    console.log(fileData);

    const ast = parser.parse(fileData);

    console.log("AST:");
    console.log(JSON.stringify(ast, null, 4));

    const output = [];
    genCode(ast, output);

    console.log("Generated code:");
    console.log(output.join("\r\n"));
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