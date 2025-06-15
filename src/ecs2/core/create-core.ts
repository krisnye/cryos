import { FromSchema, Schema } from "data";
import { createEntityLocationTable } from "../entity-location-table";
import * as ARCHETYPE from "../archetype";
import * as TABLE from "data/table";
import { Archetype } from "../archetype/archetype";
import { CoreComponents } from "../core-components";
import { Entity, EntitySchema } from "../entity";
import { Core, EntityUpdateValues, EntityValues, QueryOptions } from "./core";
import { Simplify } from "types";
import { Components } from "ecs2/components";
import { StringKeyOf } from "types/string-key-of";

export function createCore<NC extends Components>(newComponents: NC): Core<Simplify<CoreComponents & { [K in StringKeyOf<NC>]: FromSchema<NC[K]> }>> {
    type C = CoreComponents & { [K in StringKeyOf<NC>]: FromSchema<NC[K]> };

    const components: { readonly [K in StringKeyOf<C>]: Schema } = { id: EntitySchema, ...newComponents };
    const entityLocationTable = createEntityLocationTable();
    const archetypes = [] as unknown as Archetype<C>[] & { readonly [x: string]: Archetype<C> };

    const queryArchetypes = <
        Include extends StringKeyOf<C>,
        Exclude extends StringKeyOf<C> = never
    >(
        include: readonly Include[],
        options?: QueryOptions<Include, Exclude>
    ): readonly Archetype<Pick<C, Include>>[] =>{
        const results: Archetype<Pick<C, Include>>[] = [];
        for (const archetype of archetypes) {
            const hasAllRequired = include.every(comp => archetype.columns[comp] !== undefined);
            const hasNoExcluded = !options?.exclude || options.exclude.every(comp => archetype.columns[comp] === undefined);
            if (hasAllRequired && hasNoExcluded) {
                results.push(archetype as unknown as Archetype<Pick<C, Include>>);
            }
        }
        return results;
    }

    const ensureArchetype = <CC extends StringKeyOf<C>>(componentNames: readonly CC[]): Archetype<CoreComponents & { [K in CC]: C[K] }> => {
        for (const archetype of queryArchetypes(componentNames)) {
            if (archetype.components.size === componentNames.length) {
                return archetype as unknown as Archetype<CoreComponents & { [K in CC]: C[K] }>;
            }
        }
        const id = archetypes.length;
        const componentSchemas: { [K in CC]: Schema } = {} as { [K in CC]: Schema };
        let hasId = false;
        for (const comp of componentNames) {
            if (comp === "id") {
                hasId = true;
            }
            componentSchemas[comp] = components[comp];
        }
        if (!hasId) {
            throw new Error("id is required");
        }
        const archetype = ARCHETYPE.createArchetype(componentSchemas as any, id, entityLocationTable);
        archetypes.push(archetype as unknown as Archetype<C>);
        return archetype as unknown as Archetype<CoreComponents & { [K in CC]: C[K] }>;
    }

    const { locate } = entityLocationTable;

    const selectEntity = (entity: Entity): EntityValues<C> | null => {
        const location = locate(entity);
        return location !== null ? TABLE.getRowData(archetypes[location.archetype], location.row) : null;
    }

    const deleteEntity = (entity: Entity) => {
        const location = locate(entity);
        if (location !== null) {
            const archetype = archetypes[location.archetype];
            ARCHETYPE.deleteRow(archetype, location.row, entityLocationTable);
            entityLocationTable.delete(entity);
        }
    }

    const updateEntity = (entity: Entity, components: EntityUpdateValues<C>) => {
        const currentLocation = locate(entity);
        if (currentLocation === null) {
            throw "Entity not found";
        }
        const currentArchetype = archetypes[currentLocation.archetype];
        let newArchetype = currentArchetype;
        let addComponents: null | StringKeyOf<C>[] = null;
        let removeComponents: null | StringKeyOf<C>[] = null;
        for (const key in components) {
            if (components[key as any] === undefined) {
                (removeComponents ??= []).push(key as StringKeyOf<C>);
                // we remove the delete components so we can use this object for the new row data
                delete (components as any)[key as any];
            }
            else if (!currentArchetype.components.has(key as StringKeyOf<C>)) {
                (addComponents ??= []).push(key as StringKeyOf<C>);
            }
        }
        if (addComponents || removeComponents) {
            // currently changing archetype requires a set, but later we should have an edge map for better performance
            // Alternatively we can have a faster path using addComponent and deleteComponent.
            const newComponents = new Set(currentArchetype.components);
            if (addComponents) {
                for (const comp of addComponents) {
                    newComponents.add(comp);
                }
            }
            if (removeComponents) {
                for (const comp of removeComponents) {
                    newComponents.delete(comp);
                }
            }
            newArchetype = ensureArchetype(Array.from(newComponents) as StringKeyOf<C>[]) as unknown as Archetype<C>;
        }
        if (newArchetype !== currentArchetype) {
            // create a new row in the new archetype
            const currentData = TABLE.getRowData(currentArchetype, currentLocation.row);
            // deletes the row from the current archetype (this will update the entity location table for any row which may have been moved into it's position)
            ARCHETYPE.deleteRow(currentArchetype, currentLocation.row, entityLocationTable);
            const newRow = TABLE.addRow(newArchetype, { ...currentData, ...components });
            // update the entity location table for the entity so it points to the new archetype and row
            entityLocationTable.update(entity, { archetype: newArchetype.id, row: newRow });
        } else {
            TABLE.updateRow(newArchetype, currentLocation.row, components as any);
        }
    }

    const core: Core<C> = {
        components,
        queryArchetypes,
        ensureArchetype,
        locate,
        read: selectEntity,
        delete: deleteEntity,
        update: updateEntity,
    };
    return core as any;
}
