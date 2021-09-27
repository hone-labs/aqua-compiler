# Aqua-compiler

A TEAL compiler and REPL.

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
npx ts-node src/cli.ts test.aqua
```

## Executing a file

```bash
aqua exec test.aqua
```

Or:

```bash
npx ts-node src/cli.ts exec test.aqua
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
