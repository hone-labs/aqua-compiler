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
export const visitors: INodeVisitorMap = {};

function loadVisitors() {
    // https://webpack.js.org/configuration/module/#module-contexts
    const visitorsContext = require.context("./visitors", true, /\.\/.*\.ts$/);
    for (const key of visitorsContext.keys()) {
        const nodeName = key.substring(2, key.length - 3);
        visitors[nodeName] = visitorsContext(key).default;
    }
}

loadVisitors();

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
    // Loads a visitor function from a code module.
    //
    private loadVisitor(filePath: string): NodeVisitorFn | undefined {
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
        let visitor = visitors[node.nodeType];
        if (!visitor) {
            //
            // Load visitor.
            //
            visitor = visitors[node.nodeType] = this.loadVisitor(`./visitors/${node.nodeType}`);
            if (!visitor) {
                //
                // Default the visitor.
                //
                visitor = visitors[node.nodeType] = (node, symbolResolution, symbolTable) => {
                    symbolResolution.visitChildren(node, symbolTable);
                }
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

