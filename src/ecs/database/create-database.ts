import { Schema } from "data";
import { deepAssign } from "data/object";
import { Archetype, Entity, EntitySchema, CoreComponents, Extensions, Database } from "ecs";
import { createEntityLocationTable } from "ecs/entity-location-table";
import * as ARCHETYPE from "ecs/archetype";
import * as TABLE from "data/table";

export function createDatabase(): Database<CoreComponents> {

    const components: { [K in keyof CoreComponents]: Schema } = { id: EntitySchema };
    const entityLocationTable = createEntityLocationTable();
    const archetypes: Archetype<CoreComponents>[] = [];
    const actions = {};
    const resources = {};
    const observe = {};

    const getArchetypes = function* <Include extends keyof CoreComponents, Exclude extends keyof CoreComponents = never>(
        components: Include[],
        options?: {
            exclude?: Exclude[]
        }
    ): Generator<Archetype<CoreComponents & { [K in Include]: CoreComponents[K] }>> {
        for (const archetype of archetypes) {
            const hasAllRequired = components.every(comp => archetype.columns[comp] !== undefined);
            const hasNoExcluded = !options?.exclude || options.exclude.every(comp => archetype.columns[comp] === undefined);
            if (hasAllRequired && hasNoExcluded) {
                yield archetype;
            }
        }
    }

    const getArchetype = <CC extends keyof CoreComponents>(componentNames: CC[]): Archetype<CoreComponents & { [K in CC]: CoreComponents[K] }> => {
        for (const archetype of getArchetypes(componentNames)) {
            if (archetype.components.size === componentNames.length) {
                return archetype;
            }
        }
        const id = archetypes.length;
        let hasId = false;
        const componentSchemas: { [K in CC]: Schema } = {} as { [K in CC]: Schema };
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
                removeComponents ||= [];
                removeComponents.push(key as keyof CoreComponents);
                // we remove the delete components so we can use this object for the new row data
                delete components[key as keyof CoreComponents];
            }
            else if (!currentArchetype.components.has(key as keyof CoreComponents)) {
                addComponents ||= [];
                addComponents.push(key as keyof CoreComponents);
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

    const withComponent = <NC extends string, T>(
        componentName: NC,
    ) => {
        return <T>(schema: Schema = {}) => {
            (components as any)[componentName] = schema;
            return database as any;
        }
    }

    const withComponents = <NC extends { [name: string]: Schema }>(
        newComponentSchemas: NC
    ) => {
        Object.assign(components, newComponentSchemas);
        return database as any;
    }

    const withArchetypes = <A extends { [name: string]: (keyof CoreComponents)[] }>(
        newArchetypes: A
    ) => {
        deepAssign(
            archetypes,
            Object.fromEntries(
                Object.entries(newArchetypes).map(([name, components]) => {
                    return [name, database.getArchetype(components as any)];
                })
            )
        );
        return database as any;
    }

    const withResources = <NR extends { [name: string]: unknown }>(
        newResources: NR
    ) => {
        deepAssign(resources, newResources);
        return database as any;
    }

    const withActions = <NA extends Record<string, (this: Database<CoreComponents, Extensions>, ...args: unknown[]) => void>>(
        newActions: NA
    ) => {
        deepAssign(
            actions,
            Object.fromEntries(
                Object.entries(newActions).map(
                    ([name, action]) => [name, action.bind(database)]
                ) as any
            )
        );
        return database as any;
    }

    const withExtension = <E extends Partial<Extensions>>(extension: E) => {
        if (extension.archetypes) {
            withArchetypes(extension.archetypes);
        }
        if (extension.resources) {
            withResources(extension.resources);
        }
        if (extension.actions) {
            withActions(extension.actions);
        }
        return database as any;
    }


    const simplifyTypes = () => {
        return database as any;
    }

    const database: Database<CoreComponents, Extensions> = {
        __brand: "Database",
        components,
        archetypes,
        resources,
        actions,
        observe,
        getArchetype,
        getArchetypes,
        locateEntity,
        selectEntity,
        deleteEntity,
        updateEntity,
        withComponent,
        withComponents,
        withArchetypes,
        withResources,
        withActions,
        simplifyTypes,
    };
    return database;
}
