import { TypedBuffer } from "../typed-buffer";

export interface Table<C> {
    columns: { [K in keyof C]: TypedBuffer<C[K]> }
    rows: number;
}
