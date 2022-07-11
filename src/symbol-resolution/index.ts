import { ASTNode } from "../ast";
import { ISymbolTable, SymbolTable, SymbolType } from "../symbol-table";

//
// Defines a function that can resolve symbols for an AST node.
//
type NodeHandler = (node: ASTNode, symbolResolution: ISymbolResolution, symbolTable: ISymbolTable) => void;

//
// Lookup table for funtions that handle code generation for each node.
//
interface INodeHandlerMap {
    [index: string]: NodeHandler | undefined;
}

//
// Handles symbol resolution for the Aqua compiler.
//
export interface ISymbolResolution {

    //
    // Resolve symbols, annotates the AST and binds variables (etc) to their symbol table entries.
    // Computes space required by functions for local variables.
    //
    resolveSymbols(ast: ASTNode): void;

    //
    // Visits a node to resolve symbols.
    //
    visitNode(node: ASTNode, symbolTable: ISymbolTable): void;

    //
    // Visits each child to resolve symbols.
    //
    visitChildren(node: ASTNode, symbolTable: ISymbolTable): void;
}

//
// Handles symbol resolution for the Aqua compiler.
//
export class SymbolResolution implements ISymbolResolution {

    //
    // Resolve symbols, annotates the AST and binds variables (etc) to their symbol table entries.
    // Computes space required by functions for local variables.
    //
    resolveSymbols(ast: ASTNode): void {

        //
        // Resolve symbols for the AST and compute storage space.
        //
        const globalSymbolTable = new SymbolTable(1); // The stack pointer occupies position 0, so global variables are allocated from position 1.
        this.visitNode(ast, globalSymbolTable);
    }

    //
    // Loads a visitor function from a code module.
    //
    private loadVisitor(filePath: string): NodeHandler | undefined {
        try {
            require.resolve(filePath);
        }
        catch (e) {
            // Module doesn't exist.
            return undefined;
        }

        return require(filePath).default;
    }

    //
    // Resolves symbols and allocates space for variables.
    //
    visitNode(node: ASTNode, symbolTable: ISymbolTable): void {
        let visitor = this.visitors[node.nodeType];
        if (!visitor) {
            //
            // Load visitor.
            //
            visitor = this.visitors[node.nodeType] = this.loadVisitor(`./visitors/${node.nodeType}`);
            if (!visitor) {
                visitor = this.visitors[node.nodeType] = (node, symbolResolution, symbolTable) => {
                    this.visitChildren(node, symbolTable);
                }
            }
        }

        visitor(node, this, symbolTable);
    }

    //
    // Resolves symbols and allocates space for variables.
    //
    visitChildren(node: ASTNode, symbolTable: ISymbolTable): void {
        if (node.children) {
            for (const child of node.children) {
                this.visitNode(child, symbolTable);
            }
        }
    }

    //
    // Lookup table for funtions that handle symbol resoluton for each node.
    //
    visitors: INodeHandlerMap = {
        
        "if-statement": (node, symbolResolution, symbolTable) => {
            //TODO: if statements should have their own symbol tables.

            this.visitChildren(node, symbolTable);
        
            this.visitNode(node.ifBlock!, symbolTable);
        
            if (node.elseBlock) {
                this.visitNode(node.elseBlock, symbolTable);                
            }
        },

        "while-statement": (node, symbolResolution, symbolTable) => {
            this.visitChildren(node, symbolTable);
            this.visitNode(node.body!, symbolTable);
        },

        "function-call": (node, symbolResolution, symbolTable) => {
            this.visitChildren(node, symbolTable);
            for (const arg of node.functionArgs || []) {
                this.visitNode(arg, symbolTable);
            }
        }, 
    };

}

