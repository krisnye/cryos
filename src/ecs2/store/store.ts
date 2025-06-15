import { StringKeyOf } from "types/string-key-of";
import { CoreComponents } from "../core-components";
import { ResourceComponents } from "../resource-components";
import { Core, ReadonlyCore } from "../core/core";

export interface ReadonlyStore<
    C extends CoreComponents = CoreComponents,
    R extends ResourceComponents = never
> extends ReadonlyCore<C> {
    readonly resources: { readonly [K in StringKeyOf<R>]: R[K] };
}

/**
 * Store is the main interface for storing components, entities and resources.
 */
export interface Store<
    C extends CoreComponents = CoreComponents,
    R extends ResourceComponents = never
> extends Core<C> {
    readonly resources: R;
}
