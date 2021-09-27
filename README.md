# Aqua-compiler

A TEAL compiler and REPL.

## Quick setup

This is a [meta repo](https://www.npmjs.com/package/meta) so clone like this:

```bash
meta git clone git@github.com:sovereign-labs/aqua-compiler.git
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
npx ts-node -T src/cli.ts test.aqua
```

**Note** the use of `-T` with `ts-node`. There's an issue with `ts-node` and TypeScript project references and enabling "transpile only" ignores the error.

If you want to compile and check for compiler errors please used `npm run build`.

## Executing a file

```bash
aqua exec test.aqua
```

Or:

```bash
npx ts-node -T src/cli.ts exec test.aqua
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
npm start
```

Or with live reload:

```bash
npm run start:dev
```

Trying entering expressions at the REPL prompt:

- `txn Amount >= 1000;`
- `15 + txn Amount >= 1000;`
- `txn Amount <= arg 0;`
- `txn Amount + arg0 > 1000 && arg1 > 30;`
- `txn Receiver == addr ABC123;`
- `"a string" == txn Something;`
- `return 1+2;`


## Run tests

```bash
npm test
```

Or 

```bash
npm run test:watch
```
