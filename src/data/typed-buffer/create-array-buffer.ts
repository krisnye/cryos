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
        move(fromIndex: number, toIndex: number): void {
            array[toIndex] = array[fromIndex];
        },
    } as const satisfies TypedBuffer<T,T[]>;
    return typedBuffer;
}