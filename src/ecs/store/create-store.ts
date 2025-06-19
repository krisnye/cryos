import { ResourceComponents } from "./resource-components";
import { ComponentSchemas } from "./component-schemas";
import { StringKeyOf } from "types/string-key-of";
import { CoreComponents } from "../core-components";
import { Simplify } from "types";
import { Store } from "./store";
import { FromSchema, Schema } from "data";
import { createCore } from "./core/create-core";
import { Entity } from "../entity";
import { Core, QueryOptions } from "./core/core";

export function createStore<NC extends ComponentSchemas, R extends ResourceComponents>(
    newComponentSchemas: NC,
    resourceDefaults: R,
): Store<Simplify<CoreComponents & { [K in StringKeyOf<NC>]: FromSchema<NC[K]> }>, { -readonly [K in StringKeyOf<R>]: R[K] }> {
    type C = CoreComponents & { [K in StringKeyOf<NC>]: FromSchema<NC[K]> };
    const resources = {} as R;

    const resourceSchema = {} as const satisfies Schema;
    const componentAndResourceSchemas: { [K in StringKeyOf<C | R>]: Schema } = { ...newComponentSchemas };
    // Resources are stored in the core as components, so we need to add them to the componentSchemas
    for (const name of Object.keys(resourceDefaults)) {
        const resourceId = name as StringKeyOf<C | R>;
        componentAndResourceSchemas[resourceId] = resourceSchema;
    }

    const core = createCore(componentAndResourceSchemas) as unknown as Core<C>;

    // Each resource will be stored as the only entity in an archetype of [id, <resourceName>]
    // The resource component we added above will contain the resource value
    for (const [name, resource] of Object.entries(resourceDefaults)) {
        const resourceId = name as StringKeyOf<C | R>;
        const archetype = core.ensureArchetype(["id", resourceId]);
        archetype.insert({ [resourceId]: resource } as any);
        const row = 0;
        Object.defineProperty(resources, name, {
            get: () => archetype.columns[resourceId]!.get(row),
            set: (value) => {
                archetype.columns[resourceId]!.set(row, value);
            },
            enumerable: true,
        });
    }

    const select = <
        Include extends StringKeyOf<C>,
        Exclude extends StringKeyOf<C> = never
    >(
        include: Include[],
        options?: QueryOptions<Include, Exclude>
    ): readonly Entity[] => {
        const archetypes = core.queryArchetypes(include, options);
        let length = 0;
        for (const archetype of archetypes) {
            length += archetype.rows;
        }
        const entities = new Array<Entity>(length);
        let index = 0;
        for (const archetype of archetypes) {
            const typedArray = archetype.columns.id.getTypedArray();
            for (let i = 0; i < archetype.rows; i++) {
                entities[index++] = typedArray[i];
            }
        }
        return entities;
    }

    const store: Store<C, R> = {
        ...core,
        resources,
        select,
    };
    
    return store as any;
}
