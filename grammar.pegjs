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
    = left:multiplicative "+" right:additive { return makeOperator("+", left.type, [ left, right ]); }
    / left:multiplicative "-" right:additive { return makeOperator("-", left.type, [ left, right ]); }
    / multiplicative

multiplicative
    = left:primary "*" right:multiplicative { return makeOperator("*", left.type, [ left, right ]); }
    / left:primary "/" right:multiplicative { return makeOperator("/", left.type, [ left, right ]); }
    / primary

primary
  = integer
  / "(" additive ")"

integer "integer"
    = [0-9]+ { return makeLiteral("int", "integer", parseInt(text(), 10)); }