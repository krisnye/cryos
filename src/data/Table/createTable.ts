import { createTypedBuffer, TypedBuffer } from "../buffers";
import { InferType, Schema } from "../Schema";
import { Table } from "./Table";

export const createTable = <C extends Record<string, Schema>>(schemas: C) : Table<{ [K in keyof C]: InferType<C[K]> }> => {
    const columns = {} as { [K in keyof C]: TypedBuffer<InferType<C[K]>> };
    for (let name in schemas) {
        columns[name] = createTypedBuffer({schema: schemas[name]});
    }

    return {
        columns,
        rows: 0,
    };
}