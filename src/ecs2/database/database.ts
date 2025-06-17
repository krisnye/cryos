import { ArchetypeId } from "../archetype";
import { CoreComponents } from "../core-components";
import { ResourceComponents } from "../resource-components";
import { ReadonlyStore, Store } from "../store";
import { Entity } from "../entity";
import { EntityValues } from "../store/core";
import { Observe } from "data/observe";
import { TransactionResult } from "./transactional-store";
import { StringKeyOf } from "types/string-key-of";

export type TransactionDeclaration<
    C extends CoreComponents = CoreComponents,
    R extends ResourceComponents = never,
    Input extends any | void = any
> = (db: Store<C, R>, input: Input) => void | Entity

export type TransactionDeclarations<
    C extends CoreComponents = CoreComponents,
    R extends ResourceComponents = never,
> = {
    readonly [name: string]: TransactionDeclaration<C, R>
}

export type AsyncArgsProvider<T> = () => Promise<T> | AsyncGenerator<T>;

/**
 * Converts from TransactionDeclarations to TransactionFunctions by removing the initial database argument.
 */
export type ToTransactionFunctions<T extends TransactionDeclarations<any, any>> = { [K in StringKeyOf<T>]: T[K] extends (_arg: any, arg: infer A) => (infer V) ? (arg: A | AsyncArgsProvider<A>) => V extends void | Entity ? V : never : never }

export type TransactionFunctions = { readonly [K: string]: (args?: any) => void | Entity };

export interface Database<
    C extends CoreComponents = CoreComponents,
    R extends ResourceComponents = never,
    T extends TransactionFunctions = never,
> extends ReadonlyStore<C, R> {
    readonly transactions: T;
    readonly observe: {
        readonly component: { readonly [K in StringKeyOf<C>]: Observe<void> };
        readonly resource: { readonly [K in StringKeyOf<R>]: Observe<R[K]> };
        readonly transactions: Observe<TransactionResult<C>>;
        entity(id: Entity): Observe<EntityValues<C> | null>;
        archetype(id: ArchetypeId): Observe<void>;
    }
}
