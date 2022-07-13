//
// Interface for reporting errors.
//
export interface IError {
    //
    // The error message.
    //
    message: string;

    //
    // 1-based line number where the error occurred.
    //
    line: number;

    //
    // 0-based column number where the error occurred.
    //
    column: number;
}

//
// Defines a handler for errors.
//
export type OnErrorFn = (err: IError) => void;
