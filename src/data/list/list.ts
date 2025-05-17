import { TypedBuffer } from "data/typed-buffer";

export interface List<T> extends TypedBuffer<T> {
    push(value: T): void;
    pop(): T;
}
