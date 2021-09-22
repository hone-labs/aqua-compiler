{
    //
    // Makes an AST node for an operator.
    //
    function makeOperator(opcode, type, children) {
        return {
            nodeType: "operator",
            opcode: opcode,
            type: type,
            children: children, 
        };
    }

    //
    // Helper function that's used to compose an AST from an expression in the parser.
    //
    function makeExpression(head, tail) {
        return tail.reduce((result, element) => {
            // element[0] == whitespace
            // element[1] == <the operator>
            // element[2] == whitespace
            // element[3] == <child AST node>
            return makeOperator(element[1], head.type, [ result, element[3] ]);
        }, head);
    }

    //
    // Makes an AST node for a literal value.
    //
    function makeLiteral(opcode, type, value) {
        return {
            nodeType: "literal",
            type: type,
            opcode: opcode,
            value: value,
        };
    }

    //
    // Makes an AST node for a txn operation.
    //
    function makeTxn(name) {
        return {
            nodeType: "txn",
            fieldName: name,
        };
    }

    //
    // Makes an AST node an arg operation.
    //
    function makeArg(argIndex) {
        return {
            nodeType: "arg",
            argIndex: argIndex,
        };
    }

    //
    // Makes an AST node for a statement.
    //
    function makeStmt(stmtType, children) {
        return {
            nodeType: "statement",
            stmtType: stmtType,
            children: children, 
        };
    }

    //
    // Make a block of statements.
    //
    function makeBlock(stmts) {
        return {
            nodeType: "block",
            children: stmts,
        };
    }

    let nextVariablePosition = 0;

    //
    // Makes an AST node that defines a variable.
    //
    function declareVariable(name, initialiser) {
        return {
            nodeType: "declare-variable",
            name: name,
            position: nextVariablePosition++,
            children: initialiser && [ initialiser ] || undefined,
        };
    }

    //
    // Makes an AST node that represents a variable.
    // Represents a variable.
    //
    function useVariable(name) {
        return {
            nodeType: "access-variable",
            name: name,
        };
    }
}

start
    = program

program
    = stmts:((whitespace statement)*) { return makeBlock(stmts.map(stmt => stmt[1])); }

statement
    = expr:expression whitespace ";" { return makeStmt("expr", [ expr ]); }
    / "var" whitespace name:identifier expr:(whitespace "=" whitespace expression)? whitespace ";" { return declareVariable(name, expr && expr[3] || undefined); }
    / "return" whitespace expr:expression whitespace ";" { return makeStmt("return", [ expr ]); }

expression
    = logical

logical
    = head:equality tail:(whitespace ("&&" / "||") whitespace equality)* { return makeExpression(head, tail); }

equality
    = head:comparison tail:(whitespace ("!=" / "==") whitespace comparison)* { return makeExpression(head, tail); }

comparison
    = head:term tail:(whitespace ("<=" / "<" / ">=" / ">") whitespace term)* { return makeExpression(head, tail); }

term
    = head:factor tail:(whitespace ("+" / "-") whitespace factor)* { return makeExpression(head, tail); }

factor
    = head:unary tail:(whitespace ("*" / "/") whitespace unary)* { return makeExpression(head, tail); }

unary
    = "!" whitespace child:unary { return makeOperator("!", child.type, [ child ]) }
    / primary

primary
  = integerLiteral
  / "txn" whitespace id:identifier { return makeTxn(id); }
  / "arg" whitespace value:integer { return makeArg(value); }
  / "addr" whitespace value:addr { return makeLiteral("addr", "addr", value); }
  / '"' value:stringCharacters '"' { return makeLiteral("byte", "byte", `"${value}"`); }
  / "(" whitespace node:expression whitespace ")" { return node; }
  / id:identifier { return useVariable(id); }

integerLiteral "integer"
    = value:integer { return makeLiteral("int", "integer", value); }

integer "integer"
    = [0-9]+ { return parseInt(text(), 10); }

addr "address"
    = [A-Za-z0-9]+ { return text(); }

identifier "identifier"
    = [A-Za-z_] [A-Za-z0-9_]* { return text(); }

stringCharacters "byte string"
    = (!('"') .)* { return text(); }

whitespace "whitespace"
  = [ \t\n\r]*    