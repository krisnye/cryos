import { Data, Schema } from "data";
import { Archetype, Entity, EntitySchema } from "ecs";
import { createEntityLocationTable } from "../entity-location-table";
import * as ARCHETYPE from "ecs/archetype";
import * as TABLE from "data/table";
import { Database } from "./database";
import { CoreComponents } from "./core-components";
import { createGetArchetypes } from "./create-get-archetypes";
import { createObservableDatabase } from "ecs/observable-database/create-observable-database";
import { createTransactionDatabase } from "ecs/transaction-database/create-transaction-database";
import { ArchetypeComponents } from "./archetype-components";
import { ResourceComponents } from "./resource-components";

export function createDatabase(): Database<CoreComponents, {}, {}> {

    const components: { [K in keyof CoreComponents]: Schema } = { id: EntitySchema };
    const entityLocationTable = createEntityLocationTable();
    const archetypes = [] as unknown as Archetype<CoreComponents & Partial<CoreComponents>>[] & { readonly [x: string]: Archetype<CoreComponents & Pick<CoreComponents, "id">>; };
    const resources: { [name: string]: Data } = {};

    const getArchetypes = createGetArchetypes(archetypes);

    const getArchetype = <CC extends keyof CoreComponents>(componentNames: CC[]): Archetype<CoreComponents & { [K in CC]: CoreComponents[K] }> => {
        for (const archetype of getArchetypes(componentNames)) {
            if (archetype.components.size === componentNames.length) {
                return archetype;
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
        archetypes.push(archetype as unknown as Archetype<CoreComponents>);
        return archetype as unknown as Archetype<CoreComponents & { [K in CC]: CoreComponents[K] }>;
    }

    const { locateEntity } = entityLocationTable;

    const selectEntity = (entity: Entity): CoreComponents | null => {
        const location = locateEntity(entity);
        return location.archetype >= 0 ? TABLE.getRowData(archetypes[location.archetype], location.row) : null;
    }

    const deleteEntity = (entity: Entity) => {
        const location = locateEntity(entity);
        if (location.archetype >= 0) {
            const archetype = archetypes[location.archetype];
            ARCHETYPE.deleteRow(archetype, location.row, entityLocationTable);
            entityLocationTable.deleteEntity(entity);
        }
    }

    const updateEntity = (entity: Entity, components: Partial<CoreComponents>) => {
        const currentLocation = locateEntity(entity);
        if (currentLocation.archetype < 0) {
            throw "Entity not found";
        }
        const currentArchetype = archetypes[currentLocation.archetype];
        let newArchetype = currentArchetype;
        let addComponents: null | (keyof CoreComponents)[] = null;
        let removeComponents: null | (keyof CoreComponents)[] = null;
        for (const key in components) {
            if (components[key as keyof CoreComponents] === undefined) {
                (removeComponents ??= []).push(key as keyof CoreComponents);
                // we remove the delete components so we can use this object for the new row data
                delete components[key as keyof CoreComponents];
            }
            else if (!currentArchetype.components.has(key as keyof CoreComponents)) {
                (addComponents ??= []).push(key as keyof CoreComponents);
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
            newArchetype = getArchetype(Array.from(newComponents) as (keyof CoreComponents)[]);
        }
        if (newArchetype !== currentArchetype) {
            // create a new row in the new archetype
            const currentData = TABLE.getRowData(currentArchetype, currentLocation.row);
            // deletes the row from the current archetype (this will update the entity location table for any row which may have been moved into it's position)
            ARCHETYPE.deleteRow(currentArchetype, currentLocation.row, entityLocationTable);
            const newRow = TABLE.addRow(newArchetype, { ...currentData, ...components });
            // update the entity location table for the entity so it points to the new archetype and row
            entityLocationTable.updateEntity(entity, { archetype: newArchetype.id, row: newRow });
        } else {
            TABLE.updateRow(newArchetype, currentLocation.row, components);
        }
    }

    const withComponents = <NC extends { [name: string]: Schema }>(
        newComponentSchemas: NC
    ) => {
        Object.assign(components, newComponentSchemas);
        return database as any;
    }

    const withArchetypes = <NA extends { [name: string]: (keyof CoreComponents)[] }>(
        newArchetypes: NA
    ) => {
        for (const [name, components] of Object.entries(newArchetypes)) {
            (archetypes as any)[name] = database.getArchetype(components as (keyof CoreComponents)[]);
        }
        return database as any;
    }

    const withResources = <R extends { [name: string]: unknown }>(
        newResources: R
    ) => {
        // for each resource we need to create a component, create an archetype with id and that component
        // then add the resource as the only entity in that archetype
        // finally, we will extend resources with a getter/setter for each resource
        for (const [name, resource] of Object.entries(newResources)) {
            const resourceId = name as keyof CoreComponents;
            database.withComponents({ [resourceId]: {} });
            const archetype = getArchetype(["id", resourceId]);
            archetype.create({ [resourceId]: resource });
            const row = 0;
            Object.defineProperty(resources, name, {
                get: () => archetype.columns[resourceId]!.get(row),
                set: (value) => {
                    archetype.columns[resourceId]!.set(row, value);
                },
                enumerable: true,
            });
        }
        return database as any;
    }

    const toTransactional = () => {
        return createTransactionDatabase(database as any);
    }
    
    const toObservable = () => {
        return createObservableDatabase(database.toTransactional() as any);
    }

    const database = {
        components,
        archetypes,
        resources,
        getArchetype,
        getArchetypes,
        locateEntity,
        selectEntity,
        deleteEntity,
        updateEntity,
        withComponents,
        withArchetypes,
        withResources,
        toTransactional,
        toObservable,
    } as unknown as Database<CoreComponents, {}, {}>;
    return database;
}
