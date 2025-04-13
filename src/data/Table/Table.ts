import { TypedBuffer } from "../buffers";

export interface Table<C> {
    columns: { [K in keyof C]: TypedBuffer<C[K]> }
    rows: number;
}
