import { TypedBuffer } from "./typed-buffer";

export const createArrayBuffer = <T>(args: {
    length?: number,
}): TypedBuffer<T,T[]> => {
    const {
        length = 16,
    } = args;
    const array = new Array<T>(length);
    const typedBuffer = {
        array,
        get length(): number {
            return array.length;
        },
        set length(value: number) {
            array.length = value;
        },
        get(index: number): T {
            return array[index];
        },
        set(index: number, value: T): void {
            array[index] = value;
        },
        copyWithin(target: number, start: number, end: number): void {
            array.copyWithin(target, start, end);
        },
        [Symbol.iterator](): IterableIterator<T> {
            return array[Symbol.iterator]();
        },
    } as const satisfies TypedBuffer<T,T[]>;
    return typedBuffer;
}