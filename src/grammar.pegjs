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
    = head:multiplicative whitespace tail:(("+" / "-") whitespace multiplicative)* { 
        return tail.reduce((result, element) => {
            if (element[0] === "+") {
                return makeOperator("+", head.type, [ result, element[2] ]);
            }
            else if (element[0] === "-") {
                return makeOperator("-", head.type, [ result, element[2] ]);
            }
            else {
                throw new Error(`Unexpected operator ${element[0]}`);
            }
        }, head);
    }

multiplicative
    = head:primary whitespace tail:(("*" / "/") whitespace primary)* { 
        return tail.reduce((result, element) => {
            if (element[0] === "*") {
                return makeOperator("*", head.type, [ result, element[2] ]);
            }
            else if (element[0] === "/") {
                return makeOperator("/", head.type, [ result, element[2] ]);
            }
            else {
                throw new Error(`Unexpected operator ${element[0]}`);
            }
        }, head);
    }

primary
  = integer
  / "(" whitespace node:additive whitespace ")" { return node; }

integer "integer"
    = [0-9]+ { return makeLiteral("int", "integer", parseInt(text(), 10)); }

whitespace "whitespace"
  = [ \t\n\r]*    