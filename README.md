# Aqua-compiler

An expressive high level language for [the Algorand blockchain](https://en.wikipedia.org/wiki/Algorand) smart contracts that compiles to [TEAL](https://developer.algorand.org/docs/get-details/dapps/avm/teal/specification/) code.

This is a work in progress. Please report issues and help set the direction for this project.

## Using the Aqua command

Download the latest executable for your platform from [the releases page](https://github.com/optio-labs/aqua-compiler/releases).

Add the executable to your path. If you are on MacOS or Linux you should rename the executable from `aqua-mac` or `aqua-linux` to just be called `aqua` (so the rest of the instructions make sense).

## REPL

Running the executable with no arguments starts the REPL:

```bash
aqua
```

You can type Aqua expressions and statements at the REPL and see the TEAL code that is generated.

Trying entering expressions at the REPL prompt:

- `txn.Amount >= 1000;`
- `15 + txn.Amount >= 1000;`
- `txn.Amount <= arg[0];`
- `txn.Amount + arg[0] > 1000 && arg[1] > 30;`
- `txn.Receiver == addr ABC123;`
- `"a string" == txn.Something;`
- `return 1+2;`


## Compiling an Aqua file

To compile an Aqua file to TEAL code, input the Aqua filename:

```bash
aqua my-smart-contract.aqua
```

That prints the generated TEAL code to standard output.

Typically you'll want to capture the TEAL code to a file (so you can run it against the blockchain):

```bash
aqua my-smart-contact.aqua > my-smart-contract.teal
```

## Examples of Aqua code

See the `examples` subdirectory for various examples of Aqua code.


## Development

See [the development guide](docs/DEVELOPMENT.md) for instructions on development of Aqua.