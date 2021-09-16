{
    function makeOperator(opcode, type, children) {
        return {
            nodeType: "operator",
            opcode: opcode,
            type: type,
            children: children, 
        };
    }

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
  = additive

additive
    = left:multiplicative whitespace "+" whitespace right:additive { return makeOperator("+", left.type, [ left, right ]); }
    / left:multiplicative whitespace "-" whitespace right:additive { return makeOperator("-", left.type, [ left, right ]); }
    / multiplicative

multiplicative
    = left:primary whitespace "*" whitespace right:multiplicative { return makeOperator("*", left.type, [ left, right ]); }
    / left:primary whitespace "/" whitespace right:multiplicative { return makeOperator("/", left.type, [ left, right ]); }
    / primary

primary
  = integer
  / "(" whitespace node:additive whitespace ")" { return node; }

integer "integer"
    = [0-9]+ { return makeLiteral("int", "integer", parseInt(text(), 10)); }

whitespace "whitespace"
  = [ \t\n\r]*    