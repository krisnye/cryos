import { InferType } from "../../Schema";
import { Table_addRow } from "../../Table/addRow";
import { createTable } from "../../Table/createTable";
import { CoreComponents } from "../CoreComponents";
import { Entity, EntitySchema } from "../Entity";
import { EntityLocationTable } from "../EntityLocationTable/EntityLocationTable";
import { Archetype } from "./Archetype";

export const createArchetype = <C extends { id: typeof EntitySchema }>(
    components: C,
    id: number,
    entityLocationTable: EntityLocationTable,
): Archetype<CoreComponents & { [K in keyof C]: InferType<C[K]> }> => {
    const table = createTable(components);
    const createEntity = (rowData: Omit<{ [K in keyof C]: InferType<C[K]> }, "id">): Entity => {
        // add the row (excluding entity id)
        const row = Table_addRow(archetype as any, rowData);
        // create the entity lookup record
        const entity = entityLocationTable.createEntity({ archetype: archetype.id, row });
        // set the entity id for the row (since it wasn't present in the row data)
        archetype.columns.id.set(row, entity as any);
        return entity;
    }

    const archetype = {
        __brand: "Archetype",
        id,
        ...table,
        components: new Set(Object.keys(components)),
        create: createEntity,
    } as const satisfies Archetype<{ [K in keyof C]: InferType<C[K]> }> as Archetype<CoreComponents & { [K in keyof C]: InferType<C[K]> }>;
    return archetype;
}