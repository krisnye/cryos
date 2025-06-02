import { FromSchema, Schema, TypedBuffer } from "data";
import { Archetype, Entity, EntityLocation } from "ecs";
import { Equal, Simplify } from "types";
import { Assert } from "types";
import { CoreComponents } from "./core-components";
import { ArchetypeComponents } from "./archetype-components";
import { ResourceComponents } from "./resource-components";
import { ReadonlyArchetype } from "ecs/archetype";
import { Database } from "ecs/database/database";
import { TransactionDatabase } from "ecs/transaction-database/transaction-database";

export type EntityValues<C> = CoreComponents & { [K in keyof C]?: C[K] | undefined }
export type EntityUpdateValues<C> = Omit<{ [K in keyof C]?: C[K] | undefined }, "id">;

export interface ReadonlyDatastore<
    C extends CoreComponents = CoreComponents,
    A extends ArchetypeComponents<C> = {},
    R extends ResourceComponents = {}
> {
    readonly components: { readonly [K in keyof C]: Schema };
    readonly archetypes: ReadonlyArchetype<CoreComponents & Partial<C>>[] & { readonly [K in keyof A]: ReadonlyArchetype<CoreComponents & Pick<C, A[K][number]>> };
    readonly resources: { readonly [K in keyof R]: R[K] };

    getArchetypes: <Include extends keyof C, Exclude extends keyof C = never>(
        components: Include[],
        options?: {
            exclude?: Exclude[]
        }
    ) => IterableIterator<ReadonlyArchetype<{ [K in Include]: C[K]}>>;
    getArchetype: <CC extends keyof C>(components: CC[]) => ReadonlyArchetype<{ [K in CC]: C[K]}>;
    locateEntity: (entity: Entity) => EntityLocation;
    selectEntity: (entity: Entity) => EntityValues<C> | null;
}

export interface Datastore<
    C extends CoreComponents = CoreComponents,
    A extends ArchetypeComponents<CoreComponents> = {},
    R extends ResourceComponents = {}
> extends Omit<ReadonlyDatastore<C, A, R>, "resources"> {
    readonly archetypes: Archetype<CoreComponents & Partial<C>>[] & { readonly [K in keyof A]: Archetype<CoreComponents & Pick<C, A[K][number]>> }
    readonly resources: { -readonly [K in keyof R]: R[K] };

    withComponents: <NC extends { [name: string]: Schema }>(
        addComponents: NC,
    ) => Datastore<Simplify<C & { -readonly [K in keyof NC]: FromSchema<NC[K]> }>, A, R>;
    withArchetypes: <NA extends { [name: string]: (keyof C)[] }>(
        namedArchetypes: NA
    ) => Datastore<C, Simplify<A & NA>, R>;
    withResources: <NR extends { [name: string]: unknown }>(
        newResources: NR
    ) => Datastore<C, A, Simplify<R & NR>>;
    getArchetypes: <Include extends keyof C, Exclude extends keyof C = never>(
        components: Include[],
        options?: {
            exclude?: Exclude[]
        }
    ) => IterableIterator<Archetype<{ [K in Include]: C[K]}>>;
    getArchetype: <CC extends keyof C>(components: CC[]) => Archetype<{ [K in CC]: C[K]}>;
    deleteEntity: (entity: Entity) => void;
    updateEntity: (entity: Entity, values: EntityUpdateValues<C>) => void;

    /**
     * Convert the datastore to an observable database.
     */
    toDatabase: () => Database<C, A, R>;
    /**
     * @internal
     * Internal function to convert a datastore to a transaction database.
     * This is an implementation detail and should not be used directly.
     */
    toTransactional: () => TransactionDatabase<C, A, R>;
}


() => {
    let db!: Datastore<{ id: number, a: string }>;
    let db2 = db.withComponents({ c: { type: "number" }, d: { type: "string" } });
    let db3 = db2.withArchetypes({ a: ["id", "a"] });
    let db4 = db3.withComponents({ e: { type: "number" }});
    let db5 = db4.withArchetypes({ b: ["id", "c", "d", "e"] });
    let db6 = db5.withComponents({ b: { type: "string" }});
    let db7 = db6.withArchetypes({ alpha: ["id", "a", "b"] });
    let db8 = db7.withResources({ r: "foo" });
    type CheckA = Assert<Equal<(typeof db6)["archetypes"]["a"], Archetype<{ id: number, a: string }>>>;
    type CheckB = Assert<Equal<(typeof db6)["archetypes"]["b"], Archetype<{ id: number, c: number, d: string, e: number }>>>;
    type CheckC = Assert<Equal<(typeof db7)["archetypes"]["alpha"]["columns"]["a"], TypedBuffer<string>>>;
    type CheckD = Assert<Equal<(typeof db8)["resources"]["r"], string>>;
}
