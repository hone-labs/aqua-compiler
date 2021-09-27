export interface IStack<T> {
  push: (item: T) => void
  pop: () => T
  length: () => number
  debug: (depth: number) => T[]
  peek (): T;
}

export class Stack<T> implements IStack<T> {
  private readonly _store: T[] = [];

  constructor (private readonly capacity: number = 1000) {}

  length (): number {
    return this._store.length;
  }

  push (item: T): void {
    if (this.length() === this.capacity) {
      throw new Error(`Stack overflow: cannot push more items than max capacity ${this.capacity}`);
    }
    this._store.push(item);
  }

  pop (): T {
    if (this.length() === 0) {
      throw new Error("pop from empty stack");
    }
    return this._store.pop() as T;
  }

  peek (): T {
    return this._store[this._store.length-1];
  }

  /**
   * returns an array of top elements of stack (upto depth = depth)
   * @param depth no. of elements to return (from top of stack). If depth > stack.length,
   * then a copy of entire stack is returned
   */
  debug (depth: number): T[] {
    const maxDepth = Math.min(depth, this.length());
    return [...this._store].reverse().splice(0, maxDepth); // .reverse() to return elements from top
  }
}
