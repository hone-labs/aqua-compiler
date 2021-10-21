import { Runtime, types, Interpreter } from "@algo-builder/runtime";


//
// Executes the input TEAL code in algo-builder/runtime.
//
export function execute(teal: string): any {
    const runtime = new Runtime([]);
    const interpreter = new Interpreter();
    return interpreter.execute(teal, types.ExecutionMode.APPLICATION, runtime, undefined);
    
    // TODO: Enable this code once PR is accepted with algo-builder/runtime.
    // return interpreter.executeWithResult(teal, types.ExecutionMode.APPLICATION, runtime, undefined);
}