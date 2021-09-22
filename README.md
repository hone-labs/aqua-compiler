# Aqua-compiler

A TEAL compiler and REPL.

## Setup

```bash
cd aqua-compiler
npm install
```

Also do an npm install on Algo-builder/runtime which Aqua uses to interpret TEAL code:

```
cd algo-builder/packages/runtime
yarn install

cd ../web
yarn install
```

Doing an `npm install` in the above steps results in an error.

## Build Aqua

Build the parser:

```bash
npm run build-parse
```

Build TypeScript code

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
