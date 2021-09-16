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
            return makeOperator(element[0], head.type, [ result, element[2] ]);
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
}

start
  = expression

expression
    = term

term
    = head:factor whitespace tail:(("+" / "-") whitespace factor)* { return makeExpression(head, tail); }

factor
    = head:primary whitespace tail:(("*" / "/") whitespace primary)* { return makeExpression(head, tail); }

primary
  = integer
  / "(" whitespace node:expression whitespace ")" { return node; }

integer "integer"
    = [0-9]+ { return makeLiteral("int", "integer", parseInt(text(), 10)); }

whitespace "whitespace"
  = [ \t\n\r]*    