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
}

start
  = expression

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
  / "(" whitespace node:expression whitespace ")" { return node; }

integerLiteral
    = value:integer { return makeLiteral("int", "integer", value); }

integer
    = [0-9]+ { return parseInt(text(), 10); }

addr   
    = [A-Za-z0-9]+ { return text(); }

identifier
    = [A-Za-z_] [A-Za-z0-9_]* { return text(); }

whitespace "whitespace"
  = [ \t\n\r]*    