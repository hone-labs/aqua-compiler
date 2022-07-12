import dedent from "dedent";
import { CodeEmitter } from "../code-emitter";
import { CodeGenerator } from "../code-generator";
import { parseExpression } from "../parser";
import { SymbolResolution } from "../symbol-resolution";
import { ISymbolTable, SymbolTable, SymbolType } from "../symbol-table";

//
// Normalize whitespace so we don't have to consider it when testing.
//
function normalize(input: string): string {
    return input.split("\n").map(line => line.trim()).join("\n");
}

describe("expression", () => {

	//
	// Compiles an expression to TEAL.
	//
	function compileExpression(input: string, globalSymbolTable: ISymbolTable): string {
		let errors = 0;
		const ast = parseExpression(input, err => {
			console.error(`${err.line}:${err.column}: Error: ${err.msg}`);
			errors += 1;
		});

		if (errors > 0) {
			throw new Error(`Found ${errors} errors.`);
		}

		const symbolResolution = new SymbolResolution();
		symbolResolution.resolveSymbols(ast, globalSymbolTable);

		const codeEmitter = new CodeEmitter(false);
		const codeGenerator = new CodeGenerator(codeEmitter);
		codeGenerator.generateCode(ast);
		return codeEmitter.getOutput().join("\r\n");
	}

    
    //
    // Compile the input string and check it against the expected output.
    // 
    function check(input: string, expected: string, globalSymbolTable: ISymbolTable = new SymbolTable(1)): void {
        const teal = normalize(compileExpression(input, globalSymbolTable));
        const expectedTeal = normalize(expected);
        expect(teal).toEqual(expectedTeal);
    }

    for (const operator of ["+", "-", "*", "/"]) {
        it(`can compile a ${operator} expression`, ()  => {
            check(
                `1 ${operator} 2`, 
                dedent(`
                    int 1
                    int 2
                    ${operator}
                `)
            );    
        });
    }

    it("can compile a parenthesized expression", ()  => {

        check(
            "( 1 + 2 )",
            dedent(`
                int 1
                int 2
                +
            `)
        );
    });

    for (const operator of ["+", "-", "*", "/"]) {
        it(`${operator} expressions are left associative`, () => {
            check(
                `1 ${operator} 2 ${operator} 3`, 
                dedent(`
                    int 1
                    int 2
                    ${operator}
                    int 3
                    ${operator}
                `)
            );    
        });
    }

    it("can change association with parenthesis", () => {

        check(
            "1+(2+3)",
            dedent(`
                int 1
                int 2
                int 3
                +
                +
            `)
        );
    });

    it("can mix addition and subtraction", () => {

        check(
            "1+2-3",
            dedent(`
                int 1
                int 2
                +
                int 3
                -
            `)
        );
    });

    it("can mix multiplication and division", () => {

        check(
            "1*2/3",
            dedent(`
                int 1
                int 2
                *
                int 3
                /
            `)
        );
    });

    it("can compile not operator", () => {
        check(
            "! 1",
            dedent(`
                int 1
                !
            `)
        );
    });

    it("can get txn field", () => {
        check("txn.Amount", "txn Amount");
    });

    it("can get txn array element", () => {
        check("txn.ApplicationArgs[2]", "txna ApplicationArgs 2");
    });


    it("can use txn field in expression", () => {
        check(
            "txn.Amount >= 1000", 
            dedent(`
                txn Amount
                int 1000
                >=
            `)
        );
    });

    it("can get gtxn field", () => {
        check("gtxn[3].Something", "gtxn 3 Something");
    });

    it("can get gtxn array element", () => {
        check("gtxn[3].Something[2]", "gtxna 3 Something 2");
    });

    it("can get arg", () => {
        check("arg[2]", "arg 2");
    });

    it("can use arg in expression", () => {
        check(
            "arg[3] >= 1000", 
            dedent(`
                arg 3
                int 1000
                >=
            `)
        );
    });


    it("can get global field", () => {
        check("global.Something", "global Something");
    });

    it("can compile addr", () => {
        check(
            "addr \"ABC1234\"",
            dedent(`
                addr ABC1234
            `)
        );
    });

    it("can compile string literal", () => {
        check(
            '"a cool string"',
            dedent(`
                byte "a cool string"
            `)
        );
    });

    it("can call function with zero args", () => {

        const globalSymbolTable = new SymbolTable(1);
        const symbol = globalSymbolTable.define("myFunction", SymbolType.Function);
        symbol.returnType = "void";

        check(
            'myFunction()',
            dedent(`
                callsub myFunction
            `),
            globalSymbolTable
        );
    });

    it("can call function with one args", () => {

        const globalSymbolTable = new SymbolTable(1);
        const symbol = globalSymbolTable.define("myFunction", SymbolType.Function);
        symbol.returnType = "void";

        check(
            'myFunction(1)',
            dedent(`
                int 1
                callsub myFunction
            `),
            globalSymbolTable
        );
    });

    it("can call function with multiple args", () => {

        const globalSymbolTable = new SymbolTable(1);
        const symbol = globalSymbolTable.define("myFunction", SymbolType.Function);
        symbol.returnType = "void";

        check(
            'myFunction(1, 2, 3)',
            dedent(`
                int 1
                int 2
                int 3
                callsub myFunction
            `),
            globalSymbolTable
        );
    });
});

