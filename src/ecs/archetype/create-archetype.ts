import { FromSchema } from "data";
import * as TABLE from "data/table";
import { Archetype } from "./archetype";
import { CoreComponents } from "../core-components";
import { EntityLocationTable } from "../entity-location-table";
import { Entity, EntitySchema } from "../entity";

export const createArchetype = <C extends { id: typeof EntitySchema }>(
    components: C,
    id: number,
    entityLocationTable: EntityLocationTable,
): Archetype<CoreComponents & { [K in keyof C]: FromSchema<C[K]> }> => {
    const table = TABLE.createTable(components);
    const createEntity = (rowData: Omit<{ [K in keyof C]: FromSchema<C[K]> }, "id">): Entity => {
        // add the row (excluding entity id)
        const row = TABLE.addRow(archetype as any, rowData);
        // create the entity lookup record
        const entity = entityLocationTable.create({ archetype: archetype.id, row });
        // set the entity id for the row (since it wasn't present in the row data)
        archetype.columns.id.set(row, entity as any);
        return entity;
    }

    const archetype = {
        id,
        ...table,
        components: new Set(Object.keys(components) as (keyof C & string)[]),
        insert: createEntity,
    } as const satisfies Archetype<{ [K in keyof C]: FromSchema<C[K]> }> as Archetype<CoreComponents & { [K in keyof C]: FromSchema<C[K]> }>;
    return archetype;
}