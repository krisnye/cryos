import { deepAssign } from "data/object";
import { Extensions } from "ecs";
import { CoreComponents } from "ecs";
import { Database } from "ecs";

export const staticResources = <R extends { readonly [name: string]: unknown }>(resources: R) => {
    return <C extends CoreComponents, E extends Extensions>(
        db: Database<C, E>
    ): Database<C, E & { resources: { readonly [K in keyof R]: R[K] } }> => {
        deepAssign(db.resources, resources);
        return db as any;
    };
}