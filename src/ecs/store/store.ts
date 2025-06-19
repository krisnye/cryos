import { StringKeyOf } from "types/string-key-of";
import { CoreComponents } from "../core-components";
import { ResourceComponents } from "./resource-components";
import { Core, QueryOptions, ReadonlyCore } from "./core/core";
import { Entity } from "../entity";

interface BaseStore<C extends CoreComponents> {
    select<
        Include extends StringKeyOf<C>,
        Exclude extends StringKeyOf<C> = never
    >(
        include: Include[],
        options?: QueryOptions<Include, Exclude>
    ): readonly Entity[];
}

export interface ReadonlyStore<
    C extends CoreComponents = CoreComponents,
    R extends ResourceComponents = never
> extends BaseStore<C>, ReadonlyCore<C> {
    readonly resources: { readonly [K in StringKeyOf<R>]: R[K] };
}

export type ToReadonlyStore<T extends Store<any, any>> = T extends Store<infer C, infer R> ? ReadonlyStore<C, R> : never;

/**
 * Store is the main interface for storing components, entities and resources.
 */
export interface Store<
    C extends CoreComponents = CoreComponents,
    R extends ResourceComponents = never
> extends BaseStore<C>, Core<C> {
    readonly resources: { -readonly [K in StringKeyOf<R>]: R[K] };
}
