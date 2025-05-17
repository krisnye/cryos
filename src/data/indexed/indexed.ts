
export interface ReadonlyIndexed<T> {
    readonly length: number;
    get(index: number): T;
    [Symbol.iterator](): IterableIterator<T>;
}

export interface Indexed<T> extends ReadonlyIndexed<T> {
    length: number;                 // drops `readonly`
    set(index: number, value: T): void;
    copyWithin(target: number, start: number, end: number): void;
}
