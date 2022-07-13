//
// Expect a single object to contain expected fields.
//
export function expectFields(actual: any, expected: any): void {
    for (const [key, value] of Object.entries(expected)) {
        const actualValue = actual[key];
        const expectedValue = expected[key];
        if (actualValue !== expectedValue) {
            throw new Error(`Expected "${key}" to be set to ${value}\r\nActual value: ${actualValue}\r\nExpected value: ${expectedValue}\r\nActual object: ${JSON.stringify(actual, null, 4)}`);
        }
    }
}

//
// Expect an array of object to contain expected fields.
//
export function expectArray(actual: any[], expected: any[]): void {

    expect(actual.length).toEqual(expected.length);

    for (let i = 0; i < actual.length; ++i) {
        expectFields(actual[i], expected[i]);
    }
}