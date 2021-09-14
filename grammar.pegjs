start
  = additive

additive
    = left:multiplicative "+" right:additive { 
        return {
            nodeType: "operator",
            opcode: "+",
            type: left.type,
            children: [
                left,
                right,
            ], 
        };
    }
    / multiplicative

multiplicative
    = left:primary "*" right:multiplicative { 
        return {
            nodeType: "operator",
            opcode: "*",
            type: left.type,
            children: [
                left,
                right,
            ], 
        };
    }
    / primary

primary
  = integer
  / "(" additive ")"

integer "integer"
    = [0-9]+ { 
        return {
            nodeType: "literal",
            type: "integer",
            opcode: "int",
            value: parseInt(text(), 10),
        };
    }