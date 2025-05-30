import { Entity } from "ecs";
import { CoreComponents } from "ecs/database/core-components";
import { ArchetypeComponents } from "ecs/database/archetype-components";
import { ResourceComponents } from "ecs/database/resource-components";
import { ArchetypeId } from "ecs/archetype";
import { Observe } from "data/observe";
import { TransactionResult, TransactionDatabase, TransactionDeclarations, ToTransactionFunctions, TransactionFunctions } from "ecs/transaction-database/transaction-database";
import { Database, EntityValues } from "ecs/database/database";
import { Simplify } from "types";

export type ToWritableDatabase<T extends ObservableDatabase> = T extends ObservableDatabase<infer C, infer A, infer R, infer T> ? Database<C, A, R> : never;

export interface ObservableDatabase<
    C extends CoreComponents = CoreComponents,
    A extends ArchetypeComponents<CoreComponents> = {},
    R extends ResourceComponents = {},
    T extends TransactionFunctions = {}
> extends TransactionDatabase<C, A, R> {
    transactions: T;
    readonly observe: {
        readonly component: { [K in keyof C]: Observe<void> };
        readonly resource: { [K in keyof R]: Observe<R[K]> };
        readonly transactions: Observe<TransactionResult<C>>;
        entity(id: Entity): Observe<EntityValues<C> | null>;
        archetype(id: ArchetypeId): Observe<void>;
    }
    withTransactions: <NT extends TransactionDeclarations<C, A, R>>(transactions: NT)
        => ObservableDatabase<C, A, R, Simplify<T & ToTransactionFunctions<NT>>>;
    withComputedResource<
        N extends string,
        const D extends readonly (keyof R)[],
        CT
      >(
        name: N,
        resources: D,
        compute: (resources: { [K in D[number]]: R[K] }) => CT
      ): ObservableDatabase<C, A, Simplify<R & { [K in N]: CT }>>;
}
export type ComputedResource<
  R extends ResourceComponents,
  D extends readonly (keyof R)[],
  T
> = {
  resources: D;
  // ⬇ one object parameter whose keys come from the tuple D
  compute: (resources: { [K in D[number]]: R[K] }) => T;
};

export type ComputedResources<R extends ResourceComponents> = {
  [name: string]: ComputedResource<R, readonly (keyof R)[], unknown>;
};

declare const db: ObservableDatabase<{ id: number }, {}, { a: number, b: string }, {}>;

const db2 = db.withComputedResource("foo", ["a", "b"], ({a, b}) => false);
