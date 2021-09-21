import { genCode } from "..";

describe("code generator", () => {

    it("can generate code for children", () => {

        const opcode = "test-opcode";
        const child1 = {
            nodeType: "operator",
            opcode: opcode + "-child-1",
        };
        const child2 = {
            nodeType: "operator",
            opcode: opcode + "-child-2",
        };
        const node = {
            nodeType: "operator",
            opcode: opcode + "-parent",
            children: [
                child1,
                child2,
            ],
        };
        const output: string[] = [];
        genCode(node, output);
        
        expect(output).toEqual([
            `${opcode}-child-1`,
            `${opcode}-child-2`,
            `${opcode}-parent`,
        ]);
    });

    it("can generate code for operator", () => {

        const opcode = "test-opcode";
        const node = {
            nodeType: "operator",
            opcode: opcode,
        };
        const output: string[] = [];
        genCode(node, output);
        
        expect(output).toEqual([
            opcode,
        ]);
    });

    it("can generate code for literal", () => {

        const opcode = "test-opcode";
        const value = "1234";
        const node = {
            nodeType: "literal",
            opcode: opcode,
            value: value,
        };
        const output: string[] = [];
        genCode(node, output);
        
        expect(output).toEqual([
            `${opcode} ${value}`,
        ]);
    });    

    it("can generate code for expression statement", () => {

        const node = {
            nodeType: "statement",
            stmtType: "expr",
            children: [],
        };

        const output: string[] = [];
        genCode(node, output);
        
        expect(output).toEqual([]);
    });    

    it("can generate code for return statement", () => {

        const node = {
            nodeType: "statement",
            stmtType: "return",
            children: [
                {
                    nodeType: "literal",
                    opcode: "int",
                    value: 1,
                },
            ],
        };

        const output: string[] = [];
        genCode(node, output);
        
        expect(output).toEqual([
            `int 1`,
            `return`,
        ]);
    });    

    it("can generate code for block", () => {

        const node = {
            nodeType: "block",
            children: [],
        };

        const output: string[] = [];
        genCode(node, output);
        
        expect(output).toEqual([]);
    });    
});
