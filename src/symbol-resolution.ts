import { ASTNode } from "./ast";
import { ISymbolTable, SymbolTable, SymbolType } from "./symbol-table";

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
    // Resolves symbols and allocates space for variables.
    //
    visitNode(node: ASTNode, symbolTable: ISymbolTable): void {

        const visitor = this.visitors[node.nodeType];
        if (visitor) {
            visitor(node, this, symbolTable);
        }
        else {
            this.visitChildren(node, symbolTable);
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

    //
    // Lookup table for funtions that handle symbol resoluton for each node.
    //
    visitors: INodeHandlerMap = {
        "function-declaration": (node, symbolResolution, symbolTable) => {

            this.visitChildren(node, symbolTable);

            const localSymbolTable = new SymbolTable(1, symbolTable); // The saved stack pointer occupies position 0, so local variables are occupated from position 1 in the functions stack frame.
            node.scope = localSymbolTable;

            if (node.params) {
                for (const param of node.params) {
                    localSymbolTable.define(param, SymbolType.Variable);
                }
            }
       
            this.visitNode(node.body!, localSymbolTable);
        },
        "declare-variable": (node, symbolResolution, symbolTable) => {

            this.visitChildren(node, symbolTable);

            const assignee = node.assignee!;
            if (assignee.nodeType == "tuple") {

                node.symbols = [];

                for (const child of assignee.children!)  {

                    if (child.nodeType !== "access-variable") {
                        throw new Error(`Expected tuple element to be an lvalue.`);
                    }
                    else {
                        if (symbolTable.isDefinedLocally(child.name!)) {
                            throw new Error(`${child.name!} is already declared!`);
                        }
        
                        //
                        // Allocates a position for the variable in scratch.
                        //
                        node.symbols.push(symbolTable.define(child.name!, node.symbolType!));
                    }
                }
            }
            else if (assignee.nodeType !== "access-variable") {
                throw new Error(`Expected assignee to be an lvalue.`);
            }
            else {
                if (symbolTable.isDefinedLocally(assignee.name!)) {
                    throw new Error(`${assignee.name!} is already declared!`);
                }

                //
                // Allocates a position for the variable in scratch.
                //
                node.symbol = symbolTable.define(assignee.name!, node.symbolType!);
            }      

            if (node.initializer) {
                this.visitNode(node.initializer, symbolTable);
            }
        },
        "access-variable": (node, symbolResolution, symbolTable) => {

            this.visitChildren(node, symbolTable);
            
            const symbol = symbolTable.get(node.name!);
            if (symbol === undefined) {
                throw new Error(`Variable ${node.name} is not declared!`);
            }
        
            node.symbol = symbol;
        },
        "assignment-statement": (node, symbolResolution, symbolTable) => {

            this.visitChildren(node, symbolTable);

            const assignee = node.assignee!;
            if (assignee.nodeType == "tuple") {

                node.symbols = [];

                for (const child of assignee.children!)  {

                    if (child.nodeType !== "access-variable") {
                        throw new Error(`Expected tuple element to be an lvalue.`);
                    }
                    else {
                        const symbol = symbolTable.get(child.name!);
                        if (symbol === undefined) {
                            throw new Error(`Variable ${child.name} is not declared!`);
                        }

                        if (node.checkConstantAssignment && symbol.type !== SymbolType.Variable) {
                            throw new Error(`Can't set ${symbol.name} because it is not a variable.`);
                        }
                    
                        node.symbols.push(symbol);
                    }
                }
            }
            else if (assignee.nodeType !== "access-variable") {
                throw new Error(`Expected assignee to be an lvalue.`);
            }
            else {
                const symbol = symbolTable.get(assignee.name!);
                if (symbol === undefined) {
                    throw new Error(`Variable ${assignee.name} is not declared!`);
                }

                if (node.checkConstantAssignment && symbol.type !== SymbolType.Variable) {
                    throw new Error(`Can't set ${symbol.name} because it is not a variable.`);
                }
            
                node.symbol = symbol;
            }       
        },
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

