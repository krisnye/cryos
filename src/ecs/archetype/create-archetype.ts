import { FromSchema } from "data";
import { Entity, EntitySchema, Archetype } from "ecs";
import * as TABLE from "data/table";
import { EntityLocationTable } from "ecs/entity-location-table";
import { CoreComponents } from "ecs/database/core-components";

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
        const entity = entityLocationTable.createEntity({ archetype: archetype.id, row });
        // set the entity id for the row (since it wasn't present in the row data)
        archetype.columns.id.set(row, entity as any);
        return entity;
    }

    const archetype = {
        id,
        ...table,
        components: new Set(Object.keys(components)),
        create: createEntity,
    } as const satisfies Archetype<{ [K in keyof C]: FromSchema<C[K]> }> as Archetype<CoreComponents & { [K in keyof C]: FromSchema<C[K]> }>;
    return archetype;
}