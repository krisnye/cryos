import { ArchetypeId, EntityInsertValues } from "../archetype";
import { CoreComponents } from "../core-components";
import { ResourceComponents } from "../resource-components";
import { ReadonlyStore, Store } from "../store";
import { Entity } from "../entity";
import { EntityUpdateValues } from "../core";

export interface TransactionalStore<
    C extends CoreComponents = CoreComponents,
    R extends ResourceComponents = never
> extends ReadonlyStore<C, R> {
    /**
     * Execute a transaction on the store.
     * The transactionFunction must NOT directly mutate archetype rows as those changes would not be captured.
     * Instead, use the store's update and delete and archetype insert methods to make changes.
     * @param transactionFunction - A function that takes the store as an argument and performs some operations on it.
     * @returns A promise that resolves when the transaction is complete.
     */
    execute(transactionFunction: (store: Store<C, R>) => void): TransactionResult<C>;
}

export type TransactionInsertOperation<C> = {
    type: "insert";
    values: EntityInsertValues<C>;
};

export type TransactionUpdateOperation<C> = {
    type: "update";
    entity: Entity;
    values: EntityUpdateValues<C>;
};

export type TransactionDeleteOperation = {
    type: "delete";
    entity: Entity
};

export type TransactionWriteOperation<C> =
    | TransactionInsertOperation<C>
    | TransactionUpdateOperation<C>
    | TransactionDeleteOperation;

export interface TransactionResult<C> {
    readonly redo: TransactionWriteOperation<C>[];
    readonly undo: TransactionWriteOperation<C>[];
    readonly changedEntities: Set<Entity>;
    readonly changedComponents: Set<keyof C>;
    readonly changedArchetypes: Set<ArchetypeId>;
}
