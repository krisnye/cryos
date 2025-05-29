import { Entity } from "ecs";
import { CoreComponents } from "ecs/database/core-components";
import { ArchetypeComponents } from "ecs/database/archetype-components";
import { ResourceComponents } from "ecs/database/resource-components";
import { ArchetypeId } from "ecs/archetype";
import { Observe } from "data/observe";
import { TransactionResult, TransactionDatabase, TransactionDeclarations, ToTransactionFunctions, TransactionFunctions } from "ecs/transaction-database/transaction-database";
import { EntityValues } from "ecs/database/database";
import { Simplify } from "types";

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
        => ObservableDatabase<C, A, R, Simplify<T & ToTransactionFunctions<NT> & { a: number}>>;
}
