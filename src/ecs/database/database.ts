import { InferType, Schema, TypedBuffer } from "data";
import { Assert, Equal, Simplify } from "types";
import { Archetype, Entity, EntityLocation, CoreComponents, Extensions } from "ecs";

export interface Database<
    C = CoreComponents,
    E extends Extensions = Extensions
> {
    readonly __brand: "Database";
    readonly components: { [K in keyof C]: Schema };
    readonly archetypes: Archetype<CoreComponents & Partial<C>>[] & E["archetypes"];
    readonly resources: E["resources"];
    readonly actions: E["actions"];
    readonly observe: E["observe"];
    getArchetypes: <Include extends keyof C, Exclude extends keyof C = never>(
        components: Include[],
        options?: {
            exclude?: Exclude[]
        }
    ) => IterableIterator<Archetype<{ [K in Include]: C[K]}>>;
    getArchetype: <CC extends keyof C>(components: CC[]) => Archetype<{ [K in CC]: C[K]}>;
    locateEntity: (entity: Entity) => EntityLocation;
    selectEntity: (entity: Entity) => CoreComponents & Partial<C> | null;
    deleteEntity: (entity: Entity) => void;
    updateEntity: (entity: Entity, 
        values: { [K in keyof C]?: C[K] | undefined },
    ) => void;
    withComponents: <NC extends { [name: string]: Schema }>(
        addComponents: NC,
    ) => Database<C & { -readonly [K in keyof NC]: InferType<NC[K]> }, E>;
    withArchetypes: <A extends { [name: string]: (keyof C)[] }>(
        namedArchetypes: A
    ) => Database<C, E & { archetypes: { [K in keyof A]: Archetype<CoreComponents & Pick<C, A[K][number]>> } }>;
    withActions: <NA extends Record<string, (this: Database<C, E>, ...args: any[]) => void>>(
        newActions: NA
    ) => Database<C, E & { actions: { [K in keyof NA]: OmitThisParameter<NA[K]> } }>;
    withExtension: <NT extends Database<C,E>>(extension: (db: Database<C, E>) => NT) => NT
    simplifyTypes: () => Database<Simplify<C>, Simplify<E>>;
}

function test() {
    let db!: Database<{ id: number, a: string }>;
    let db2 = db.withComponents({ c: { type: "number" }, d: { type: "string" } });
    let db3 = db2.withArchetypes({ a: ["id", "a"] });
    let db4 = db3.withComponents({ e: { type: "number" }});
    let db5 = db4.withArchetypes({ b: ["id", "c", "d", "e"] });
    let db6 = db5.withComponents({ b: { type: "string" }});
    let db7 = db6.withArchetypes({ alpha: ["id", "a", "b"] });
    type CheckA = Assert<Equal<(typeof db6)["archetypes"]["a"], Archetype<{ id: number, a: string }>>>;
    type CheckB = Assert<Equal<(typeof db6)["archetypes"]["b"], Archetype<{ id: number, c: number, d: string, e: number }>>>;
    type CheckC = Assert<Equal<(typeof db7)["archetypes"]["alpha"]["columns"]["a"], TypedBuffer<string, ArrayLike<unknown>>>>;
}
