const parser = require("./parser");
const fs = require("fs/promises");

async function main() {

    const fileData = await fs.readFile("./test.tl", "utf8");
    console.log("Input:")
    console.log(fileData);

    const result = parser.parse(fileData);
    console.log(result);
}

main()
    .catch(err => {
        console.error("An error occurred:");
        console.error(err && err.stack || err);
    });