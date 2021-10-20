{
    //
    // Makes a TEAL operation with a particular type and arguments.
    // It's just easier to setup some of these operations directly in the parser than in the code generator.
    //
    function makeOperation(opcode, type, args) {
        return {
            nodeType: "operation",
            opcode: opcode,
            type: type,
            args: args,
        };
    }

    //
    // Makes an AST node for an operator.
    //
    function makeOperator(opcode, type, children) {
        return {
            nodeType: "operation",
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
            symbolType: 0, // 0 == variable
            children: initialiser && [ initialiser ] || undefined,
        };
    }

    function declareConstant(name, initialiser) {
        return {
            nodeType: "declare-variable",
            name: name,
            symbolType: 1, // 1 == constant
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

    //
    // Makes a function call.
    //
    function makeFunctionCall(name, args) {
        return {
            nodeType: "function-call",
            name: name,
            children: args,
        };
    }

    //
    // Makes a block statement.
    //
    function makeBlock(stmts) {
        if (!Array.isArray(stmts)) {
            throw new Error(`Expected "stmts" to be an array.`);
        }

        return makeStmt("block-statment", stmts);
    }

    //
    // Makes an empty statement.
    //
    function makeEmpty() {
        return makeBlock([]);
    }

    //
    // Makes a while loop.
    //
    function makeWhileLoop(condition, body) {
        return {
            nodeType: "while-statement",
            children: [ condition ],
            body: body,
        };
    }

    //
    // Makes a for loop.
    //
    function makeForLoop(initializer, condition, increment, stmts) {
        return makeBlock([
            initializer || makeEmpty(),
            makeWhileLoop(
                condition || makeEmpty(),
                makeBlock([
                    stmts,
                    increment || makeEmpty(),
                ]),
            ),
        ]);
    }
}

start
    = declarations

declarations
    = stmts:((___ declaration ___)*) { return makeBlock(stmts.map(stmt => stmt[1])); }

declaration
    = "function" ___ fn:function {
        return fn;
    }
    / statement

function 
    = id:identifier "(" ___ params:parameters? ___ ")" ___ "{" ___ body:statements ___ "}" {
        return {
            nodeType: "function-declaration",
            name: id,
            params: params,
            body: body,
        };
    }

parameters
    = head:identifier tail:(___ "," ___ identifier)* {
        return [head].concat(tail.map(expr => expr[3]));
    }

statements
    = stmts:((___ statement)*) { return makeBlock(stmts.map(stmt => stmt[1])); }

statement
    = ___ ";" { return makeEmpty(); }
    / expr:expression ___ ";" { return makeStmt("expr-statement", [ expr ]); }
    / "let" ___ name:identifier expr:(___ "=" ___ expression)? ___ ";" { return declareVariable(name, expr && expr[3] || undefined); }
    / "const" ___ name:identifier ___ "=" ___ expr:expression ___ ";" { return declareConstant(name, expr); }
    / "return" ___ expr:expression ___ ";" { return makeStmt("return-statement", [ expr ]); }
    / "if" ___ "(" ___ condition:expression ___ ")" ___ 
        "{" ___ ifBlock:statements ___ "}" 
        elseBlock:( ___ "else" ___ "{" ___ statements ___ "}" )? {
            return makeIfStmt(condition, ifBlock, elseBlock && elseBlock[5]);
        }
    / "while" ___ "(" ___ condition:expression ___ ")" ___ stmts:block {
        return makeWhileLoop(condition, stmts);
    }
    / "for" ___ "(" initializer:(___ (variableDeclaration / expression))? ___ ";" condition:(___ expression)? ___ ";" increment:(___ expression)? ___ ")" ___ stmts:block {
        return makeForLoop(initializer && initializer[1], condition && condition[1], increment && increment[1], stmts);
    }

variableDeclaration
    = "let" ___ name:identifier expr:(___ "=" ___ expression)? ___ { return declareVariable(name, expr && expr[3] || undefined); }
    / "const" ___ name:identifier ___ "=" ___ expr:expression ___ { return declareConstant(name, expr); }

block 
    = "{" ___ stmts:statements ___ "}" { return stmts; }

expression
    = assignment

assignment
    = assignee:logical initializer:(___ "=" ___ assignment)? {
        if (!initializer) {
            return assignee;
        }

        return makeAssignment(assignee, initializer[3]);
    }

logical
    = head:equality tail:(___ ("&&" / "||") ___ equality)* { return makeExpression(head, tail); }

equality
    = head:comparison tail:(___ ("!=" / "==") ___ comparison)* { return makeExpression(head, tail); }

comparison
    = head:term tail:(___ ("<=" / "<" / ">=" / ">") ___ term)* { return makeExpression(head, tail); }

term
    = head:factor tail:(___ ("+" / "-") ___ factor)* { return makeExpression(head, tail); }

factor
    = head:unary tail:(___ ("*" / "/") ___ unary)* { return makeExpression(head, tail); }

unary
    = "!" ___ child:unary { return makeOperator("!", child.type, [ child ]) }
    / primary

primary
    = integerLiteral
    / "txn" ___ "." ___ id:identifier index:(___ "[" ___ integer ___ "]")? { 
        if (index !== null) {
            return makeOperation("txna", undefined, [ id, index[3] ]);
        }
        else {
            return makeOperation("txn", undefined, [ id ]);
    }
    }
    / "gtxn" ___ "[" ___ index:integer ___ "]" ___ "." ___ id:identifier index2:(___ "[" ___ integer ___ "]")? { 
        if (index2 !== null) {
            return makeOperation("gtxna", undefined, [ index, id, index2[3] ]); 
        }
        else {
        return makeOperation("gtxn", undefined, [ index, id ]); 
        }        
    }
    / "arg" ___ "[" ___ index:integer ___ "]" { 
        return makeOperation("arg", undefined, [ index ]); 
    }
    / "addr" ___ value:addr { 
        return makeOperation("addr", "addr", [ value ]);
    }
    / "global" ___ "." ___ id:identifier { 
        return makeOperation("global", undefined, [ id ]);
    }
    / "OnComplete" ___ "." ___ id:identifier {
        return makeOperation(id, "integer");
    }
    / '"' value:stringCharacters '"' { 
        return makeOperation("byte", "byte", [ `"${value}"` ]); 
    }
    / "(" ___ node:expression ___ ")" { return node; }
    / id:identifier args:(___ "(" (___ arguments)? ___ ")")? {
        if (!args) {
            return useVariable(id);
        }

        return makeFunctionCall(id, args[2] && args[2][1] || []);
    }

integerLiteral "integer"
    = value:integer { 
        return makeOperation("int", "integer", [ value ]); 
    }

integer "integer"
    = [0-9]+ { return parseInt(text(), 10); }

addr "address"
    = [A-Za-z0-9]+ { return text(); }

identifier "identifier"
    = [A-Za-z_] [A-Za-z0-9_]* { return text(); }

stringCharacters "byte string"
    = (!('"') .)* { return text(); }

___ "whitespace or comment"
    = (whitespace / comment)*

whitespace "whitespace character"
    = [ \t\r\n]

comment
    = singleLineComment
    / multiLineComment

singleLineComment "single-line comment"
  = "//" (!"\n" .)*

multiLineComment "multi-line comment"
  = "/*" (!"*/" .)* "*/"

arguments 
    = head:expression tail:(___ "," ___ expression)* {
        return [head].concat(tail.map(expr => expr[3]));
    }