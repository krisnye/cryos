import { TypedArray } from "data/typed-array";

interface ReadonlyTypedBuffer<T> {
    readonly length: number;
    get(index: number): T;
    [Symbol.iterator](): IterableIterator<T>;
}

export interface TypedBuffer<T> extends ReadonlyTypedBuffer<T> {
    length: number;                 // drops `readonly`
    set(index: number, value: T): void;
    copyWithin(target: number, start: number, end: number): void;

    /**
     * Returns the typed array of the buffer.
     * @throws If the buffer is not backed by a typed array.
     */
    getTypedArray(): TypedArray;
}

