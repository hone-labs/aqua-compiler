import { compileExpression } from "..";
import dedent from "dedent";

//
// Normalize whitespace so we don't have to consider it when testing.
//
function normalize(input: string): string {
    return input.split("\n").map(line => line.trim()).join("\n");
}

describe("expression", () => {

    //
    // Compile the input string and check it against the expected output.
    // 
    function check(input: string, expected: string): void {
        const teal = normalize(compileExpression(input));
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
        check("txn.ApplicationArgs[2]", "txn ApplicationArgs 2");
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
    })

    it("can compile addr", () => {
        check(
            "addr ABC1234",
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
        check(
            'myFunction()',
            dedent(`
                callsub myFunction
            `)
        );
    });

    it("can call function with one args", () => {
        check(
            'myFunction(1)',
            dedent(`
                int 1
                callsub myFunction
            `)
        );
    });

    it("can call function with multiple args", () => {
        check(
            'myFunction(1, 2, 3)',
            dedent(`
                int 1
                int 2
                int 3
                callsub myFunction
            `)
        );
    });
});

