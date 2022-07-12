import { ASTNode } from "../ast";
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
const visitors: INodeVisitorMap = {};

function loadVisitors() {
    // https://webpack.js.org/configuration/module/#module-contexts
    const visitorsContext = require.context("./visitors", true, /\.\/.*\.js$/);
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
            visitor = visitors[node.nodeType] = (node, symbolResolution, symbolTable) => {
                this.visitChildren(node, symbolTable);
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
}

