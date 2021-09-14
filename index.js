const parser = require("./parser");
const fs = require("fs/promises");

async function main() {

    const fileData = await fs.readFile("./test.tl", "utf8");
    console.log("Input:");
    console.log(fileData);

    const result = parser.parse(fileData);

    console.log("Output:");
    console.log(JSON.stringify(result, null, 4));
}

main()
    .catch(err => {
        console.error("An error occurred:");
        console.error(err && err.stack || err);
    });