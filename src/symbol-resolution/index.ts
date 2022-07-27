import { ASTNode } from "../ast";
import { IError, OnErrorFn } from "../error";
import { ISymbolTable } from "../symbol-table";

//
// Defines a function that can visit nodes in the AST to resolve symbols.
//
type NodeVisitorFn = (node: ASTNode, symbolResolution: ISymbolResolution, symbolTable: ISymbolTable) => void;

//
// Lookup table for cached visitors.
//
interface INodeVisitorMap {
    [index: string]: NodeVisitorFn | undefined;
}

//
// Lookup table to cached visitors.
//
export const visitors: INodeVisitorMap = {
    "assignment": require("./visitors/assignment").default,
    "declare-variable": require("./visitors/declare-variable").default,
    "function-declaration": require("./visitors/function-declaration").default,
    "function-call": require("./visitors/function-call").default,
    "identifier": require("./visitors/identifier").default,
    "if-statement": require("./visitors/if-statement").default,
    "while-statement": require("./visitors/while-statement").default,
};

//
// Handles symbol resolution for the Aqua compiler.
//
export interface ISymbolResolution {

    //
    // Resolve symbols, annotates the AST and binds variables (etc) to their symbol table entries.
    // Computes space required by functions for local variables.
    //
    resolveSymbols(ast: ASTNode, globalSymbolTable: ISymbolTable): void;

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
    // A simple interface that allows the tokenizer to report an error and continue scanning.
    //
    private onError: OnErrorFn;

    constructor(onError: OnErrorFn) {
        this.onError = onError;
    }

    //
    // Resolve symbols, annotates the AST and binds variables (etc) to their symbol table entries.
    // Computes space required by functions for local variables.
    //
    resolveSymbols(ast: ASTNode, globalSymbolTable: ISymbolTable): void {

        //
        // Resolve symbols for the AST and compute storage space.
        //
        this.visitNode(ast, globalSymbolTable);
    }

    //
    // Resolves symbols and allocates space for variables.
    //
    visitNode(node: ASTNode, symbolTable: ISymbolTable): void {
        let visitor = visitors[node.nodeType];
        if (!visitor) {
            //
            // Default the visitor.
            //
            visitor = visitors[node.nodeType] = (node, symbolResolution, symbolTable) => {
                symbolResolution.visitChildren(node, symbolTable);
            }
        }

        try {
            visitor(node, this, symbolTable);
        }
        catch (err: any) {
            this.onError(err);
        }
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
}

