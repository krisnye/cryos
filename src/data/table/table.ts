import { ReadonlyTypedBuffer, TypedBuffer } from "../typed-buffer";

export interface ReadonlyTable<C> {
    readonly columns: { readonly [K in keyof C]: ReadonlyTypedBuffer<C[K]> }
    readonly rows: number;
}

export interface Table<C> extends ReadonlyTable<C> {
    readonly columns: { readonly [K in keyof C]: TypedBuffer<C[K]> }
    rows: number;
}
