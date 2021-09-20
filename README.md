# Aqua-compiler

A TEAL compiler and REPL.

## Setup

```bash
cd aqua-compiler
npm install
```

## Build the parser

```bash
npm run build-parse
```

## Build TypeScript code

```bash
npm run build
```

## Compile a file

```bash
npx ts-node src/cli.ts test.aqua
```

## Run the REPL

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

- `txn Amount >= 1000`
- `15 + txn Amount >= 1000`
- `txn Amount <= arg 0`
- `txn Amount + arg0 > 1000 && arg1 > 30`
- `txn Receiver == addr ABC123`


## Run tests

```bash
npm test
```

Or 

```bash
npm run test:watch
```
