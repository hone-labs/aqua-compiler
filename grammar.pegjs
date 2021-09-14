start
  = additive

additive
    = left:multiplicative "+" right:additive { 
        return {
            node: "+",
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
            node: "*",
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
            node: "integer",
            value: parseInt(text(), 10),
        };
    }