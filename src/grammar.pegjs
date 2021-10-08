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
    // Makes an AST node for a gtxn operation.
    //
    function makeGTxn(index, name) {
        return {
            nodeType: "gtxn",
            transactionIndex: index,
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
    function makeStmt(nodeType, children) {
        return {
            nodeType: nodeType,
            children: children, 
        };
    }

    //
    // Makes an AST node that defines a variable.
    //
    function declareVariable(name, initialiser) {
        return {
            nodeType: "declare-variable",
            name: name,
            children: initialiser && [ initialiser ] || undefined,
        };
    }

    function declareConstant(name, initialiser) {
        return {
            nodeType: "declare-constant",
            name: name,
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

    //
    // Makes an if statement.
    //
    function makeIfStmt(condition, ifBlock, elseBlock) {
        return {
            nodeType: "if-statement",
            children: [
                condition,
            ],
            ifBlock: ifBlock,
            elseBlock: elseBlock,
        };
    }

    //
    // Makes an assignment statement.
    //
    function makeAssignment(assignee, initializer) {
        return {
            nodeType: "assignment-statement",
            assignee: assignee,
            children: [
                initializer,
            ],
        };
    }
}

start
    = statements

statements
    = stmts:((whitespace statement)*) { return makeStmt("block-statement", stmts.map(stmt => stmt[1])); }

statement
    = whitespace ";" { return makeStmt("block-statement", []); }
    / expr:expression whitespace ";" { return makeStmt("expr-statement", [ expr ]); }
    / "let" whitespace name:identifier expr:(whitespace "=" whitespace expression)? whitespace ";" { return declareVariable(name, expr && expr[3] || undefined); }
    / "const" whitespace name:identifier whitespace "=" whitespace expr:expression whitespace ";" { return declareConstant(name, expr); }
    / "return" whitespace expr:expression whitespace ";" { return makeStmt("return-statement", [ expr ]); }
    / "if" whitespace "(" whitespace condition:expression whitespace ")" whitespace 
        "{" whitespace ifBlock:statements whitespace "}" 
        elseBlock:( whitespace "else" whitespace "{" whitespace statements whitespace "}" )? {
            return makeIfStmt(condition, ifBlock, elseBlock && elseBlock[5]);
        }

expression
    = assignment

assignment
    = assignee:logical initializer:(whitespace "=" whitespace assignment)? {
        if (!initializer) {
            return assignee;
        }

        return makeAssignment(assignee, initializer[3]);
    }

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
  / "txn" whitespace "." whitespace id:identifier { return makeTxn(id); }
  / "gtxn" whitespace "[" whitespace index:integer whitespace "]" whitespace "." whitespace id:identifier { return makeGTxn(index, id); }
  / "arg" whitespace "[" whitespace index:integer whitespace "]" { return makeArg(index); }
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