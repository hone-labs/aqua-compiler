//
// Sets the type of a symbol.
//
enum SymbolType {
    Variable,
    Constant,
}

//
// Represents a symbol (e.g. variable, constant or function).
//
export interface ISymbol {

    //
    // The name of the symbol.
    //
    readonly name: string;

    //
    // The type of the symbol.
    //
    readonly type: SymbolType;

    //
    // Position of the symbol in scratch memory.
    //
    readonly position: number;
}

//
// A lookup table for symbols.
//
type SymbolTable = Map<string, ISymbol>;

//
// Defines a function that can generate code for a node.
//
type NodeHandler = (node: any, output: string[], symbolTable: SymbolTable) => void;

//
// Lookup table for funtions that handle code generation for each node.
//
interface INodeHandlerMap {
    [index: string]: NodeHandler;
}

//
// Handles TEAL code generation for the Aqua compiler.
//
export class CodeGenerator {

    //
    // Used to generate unique IDs for if statements.
    //
    private ifStatementId = 0;

    //
    // Position for the next scratch variable.
    //
    private nextVariablePosition = 0;

    //
    // Generates code from an AST representation of an Aqua script.
    //
    generateCode(node: any): string[] {
        const output: string[] = [];
        const symbolTable = new Map<string, ISymbol>();
        this.internalGenerateCode(node, output, symbolTable);
        return output;
    }

    //
    // Generates code from an AST representation of an Aqua script.
    //
    private internalGenerateCode(node: any, output: string[], symbolTable: SymbolTable): void {

        if (node.children) {
            for (const child of node.children) {
                this.internalGenerateCode(child, output, symbolTable);
            }
        }

        const nodeHandler = this.nodeHandlers[node.nodeType];
        if (nodeHandler === undefined) {
            throw new Error(`Unexpected node type ${node.nodeType}`);
        }

        this.nodeHandlers[node.nodeType](node, output, symbolTable);
    }

    //
    // Lookup table for funtions that handle code generation for each node.
    //
    nodeHandlers: INodeHandlerMap = {
        operator: (node, output, symbolTable) => output.push(node.opcode),
        literal: (node, output, symbolTable) => output.push(`${node.opcode} ${node.value}`),
        txn: (node, output, symbolTable) => output.push(`txn ${node.fieldName}`),
        gtxn: (node, output, symbolTable) => output.push(`gtxn ${node.transactionIndex} ${node.fieldName}`),
        arg: (node, output, symbolTable) => output.push(`arg ${node.argIndex}`),
        "block-statement": (node, output, symbolTable) => {},
        "expr-statement": (node, output, symbolTable) => {},
        "return-statement": (node, output, symbolTable) => output.push(`return`),
        "declare-variable": (node, output, symbolTable) => {
            if (symbolTable.has(node.name)) {
                throw new Error(`Variable ${node.name} is already declared!`);
            }

            //
            // Allocate a position for the variable in scratch.
            //
            const position = this.nextVariablePosition++;

            symbolTable.set(node.name, {
                name: node.name,
                type: SymbolType.Variable,
                position: position,
            });

            if (node.children && node.children.length > 0) {
                // Set variable from initialiser.
                output.push(`store ${position}`);
            }
        },
        "declare-constant": (node, output, symbolTable) => {
            if (symbolTable.has(node.name)) {
                throw new Error(`Variable ${node.name} is already declared!`);
            }

            //
            // Allocate a position for the variable in scratch.
            //
            const position = this.nextVariablePosition++;

            symbolTable.set(node.name, {
                name: node.name,
                type: SymbolType.Constant,
                position: position,
            });

            if (node.children && node.children.length > 0) {
                // Set variable from initialiser.
                output.push(`store ${position}`);
            }
        },
        "access-variable": (node, output, symbolTable) => {
            const symbol = symbolTable.get(node.name);
            if (symbol === undefined) {
                throw new Error(`Variable ${node.name} is not declared!`);
            }

            // Get variable from scratch.
            output.push(`load ${symbol.position}`);
        },
        "if-statement": (node, output, symbolTable) => {
            
            this.ifStatementId += 1;

            output.push(`bz else-${this.ifStatementId}`);

            this.internalGenerateCode(node.ifBlock, output, symbolTable);

            output.push(`b end-${this.ifStatementId}`);

            output.push(`else-${this.ifStatementId}:`);

            if (node.elseBlock) {
                this.internalGenerateCode(node.elseBlock, output, symbolTable);
            }

            output.push(`end-${this.ifStatementId}:`);
        },
        "assignment-statement": (node, output, symbolTable) => {

            if (node.assignee.nodeType !== "access-variable") {
                throw new Error(`Expected assignee to be an lvalue.`);
            }

            const symbol = symbolTable.get(node.assignee.name);
            if (symbol === undefined) {
                throw new Error(`Variable ${node.assignee.name} is not declared!`);
            }

            if (symbol.type !== SymbolType.Variable) {
                throw new Error(`Can't set ${symbol.name} because it is not a variable.`);
            }

            // Store variable to scratch.
            output.push(`store ${symbol.position}`);
        },
    };

}

