
export interface TypedBuffer<T,A extends ArrayLike<unknown> = ArrayLike<unknown>> {
    length: number;
    array: A;
    get(index: number): T;
    set(index: number, value: T): void;
    move(fromIndex: number, toIndex: number): void;
}
