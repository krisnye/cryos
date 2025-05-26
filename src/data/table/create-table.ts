import { createTypedBuffer, TypedBuffer } from "../typed-buffer";
import { FromSchema, Schema } from "../schema";
import { Table } from "./table";

export const createTable = <C extends Record<string, Schema>>(schemas: C) : Table<{ [K in keyof C]: FromSchema<C[K]> }> => {
    const columns = {} as { [K in keyof C]: TypedBuffer<FromSchema<C[K]>> };
    for (let name in schemas) {
        columns[name] = createTypedBuffer({schema: schemas[name]});
    }

    return {
        columns,
        rows: 0,
    };
}