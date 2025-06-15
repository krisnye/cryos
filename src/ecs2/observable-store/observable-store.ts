import { ArchetypeId } from "../archetype";
import { CoreComponents } from "../core-components";
import { ResourceComponents } from "../resource-components";
import { ReadonlyStore, Store } from "../store";
import { Entity } from "../entity";
import { EntityValues } from "../core";
import { Observe } from "data/observe";
import { TransactionResult } from "../transactional-store";

export type TransactionDeclaration<
    C extends CoreComponents = CoreComponents,
    R extends ResourceComponents = never,
    Input extends any | void = any
> = (db: Store<C, R>, input: Input) => void

export type TransactionDeclarations<
    C extends CoreComponents = CoreComponents,
    R extends ResourceComponents = never,
> = {
    readonly [name: string]: TransactionDeclaration<C, R>
}

export type TransactionFunctions = { readonly [K: string]: (...args: any | void) => void };

export interface ObservableStore<
    C extends CoreComponents = CoreComponents,
    R extends ResourceComponents = never,
    T extends TransactionFunctions = never,
> extends ReadonlyStore<C, R> {
    readonly transactions: T;
    readonly observe: {
        readonly component: { readonly [K in keyof C]: Observe<void> };
        readonly resource: { readonly [K in keyof R]: Observe<R[K]> };
        readonly transactions: Observe<TransactionResult<C>>;
        entity(id: Entity): Observe<EntityValues<C> | null>;
        archetype(id: ArchetypeId): Observe<void>;
    }
}
