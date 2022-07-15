const path = require("path");

const outputPath = path.resolve(__dirname, "dist");

module.exports = {
    entry: "./src/index.ts",
    output: {
        path: outputPath,
        filename: "index.js",
        libraryTarget: "commonjs2",
    },

    target: "web",
    mode: "development", //todo: production
    devtool: "source-map",

    resolve: {
        extensions: [ ".ts" ],
    },

    module: {
        rules: [
            {
                test: /\.ts?$/,
                use: "ts-loader",
                exclude: /node_modules/,
            },
        ],
    },

};