const package = require("./package.json");
if (package.version !== process.env.VERSION) {
    process.exit(1); // Failed the build process if the version from package.json is not equal to the VERSION environment variable.
}
