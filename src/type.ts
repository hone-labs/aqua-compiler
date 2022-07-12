//
// Represents a type.
//
export interface IType {
    //
    // The name of the type.
    //
    type: "void" | "uint64" | "byte[]" | "tuple";

    //
    // Children for tuple types.
    //
    children?: IType[];
}