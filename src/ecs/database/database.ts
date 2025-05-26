import { Data, FromSchema, Schema, TypedBuffer } from "data";
import { Archetype, Entity, EntityLocation } from "ecs";
import { Equal, Simplify } from "types";
import { Assert } from "types";
import { CoreComponents } from "./core-components";

export interface Database<
    C extends CoreComponents = CoreComponents,
    A extends { [name: string]: (keyof C)[] } = {},
    R extends { [name: string]: unknown } = {}
> {
    readonly components: { [K in keyof C]: Schema };
    readonly archetypes: Archetype<CoreComponents & Partial<C>>[] & { [K in keyof A]: Archetype<CoreComponents & Pick<C, A[K][number]>> }
    readonly resources: R;

    withComponents: <NC extends { [name: string]: Schema }>(
        addComponents: NC,
    ) => Database<Simplify<C & { -readonly [K in keyof NC]: FromSchema<NC[K]> }>, A, R>;
    withArchetypes: <NA extends { [name: string]: (keyof C)[] }>(
        namedArchetypes: NA
    ) => Database<C, Simplify<A & NA>, R>;
    withResources: <NR extends { [name: string]: Data }>(
        newResources: NR
    ) => Database<C, A, Simplify<R & NR>>;
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
    updateEntity: (entity: Entity, values: { [K in keyof C]?: C[K] | undefined }) => void;
}


() => {
    let db!: Database<{ id: number, a: string }>;
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
