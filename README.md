# Aqua-compiler

An expressive high level language for the Algorand block chain that compiles to TEAL code.

This is a work in progress. Please report issues and help set the direction for this project.

## Quick setup

Clone the repo:

```bash
git clone git@github.com:sovereign-labs/aqua-compiler.git
```

Install dependencies:

```bash
cd aqua-compiler
npm install
```

Then run it:

```bash
npm start
```

Or with live reload:

```bash
npm run start:dev
```

## Build Aqua

Build the parser:

```bash
npm run build-parse
```

Build TypeScript code:

```bash
npm run build 
```

## Compile a file

```bash
aqua test.aqua
```

Or:

```bash
npx ts-node src/cli.ts examples/test.aqua
```

## Executing a file

```bash
aqua exec test.aqua
```

Or:

```bash
npx ts-node src/cli.ts exec examples/test.aqua
```

## Run the REPL

```bash
aqua
```

Or:

```bash
npx ts-node src/cli.ts
```

Or 

```bash
npm run start:repl
```


Trying entering expressions at the REPL prompt:

- `txn Amount >= 1000;`
- `15 + txn Amount >= 1000;`
- `txn Amount <= arg 0;`
- `txn Amount + arg0 > 1000 && arg1 > 30;`
- `txn Receiver == addr ABC123;`
- `"a string" == txn Something;`
- `return 1+2;`

## Visualise the AST

```bash
npm run start:ast
```

## Run tests

```bash
npm test
```

Or 

```bash
npm run test:watch
```

## Build the binary executables

Make sure to have use Node.js v12.15.0 which is known to work with Nexe.

Use `nvm` to install and swap between different versions of Node.js:

```bash
nvm install 12.15.0
nvm use 12.15.0
```

!! Build the TypeScript code:

```bash
npm run build
```

Build for each platform:

```bash
npm run build-macos
npm run build-linux
npm run build-win
```

Or 

```bash
npm run build-all
```

**NOTE:** Linux and MacOS builds should be built on Linux.