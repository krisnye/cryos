import { Datastore, Entity } from "ecs";
import { CoreComponents } from "ecs/datastore/core-components";
import { ArchetypeComponents } from "ecs/datastore/archetype-components";
import { ResourceComponents } from "ecs/datastore/resource-components";
import { EntityUpdateValues, ReadonlyDatastore } from "ecs/datastore";
import { ArchetypeId, EntityCreateValues } from "ecs/archetype";

export type TransactionDeclaration<
    C extends CoreComponents = CoreComponents,
    A extends ArchetypeComponents<CoreComponents> = {},
    R extends ResourceComponents = {},
    Input extends any | void = any
> = (db: Datastore<C, A, R>, input: Input) => void

/**
 * Converts from TransactionDeclarations to TransactionFunctions by removing the initial database argument.
 */
export type ToTransactionFunctions<T> = { [K in keyof T]: T[K] extends (arg: any, ...args: infer A) => void ? (...args: A) => void : never }

export type TransactionDeclarations<
    C extends CoreComponents = CoreComponents,
    A extends ArchetypeComponents<CoreComponents> = {},
    R extends ResourceComponents = {}
> = {
    [name: string]: TransactionDeclaration<C, A, R>
}

export type TransactionFunctions = { [K: string]: (...args: any | void) => void };

/**
 * A transaction database is a readonly database that only allows write operations to be performed within a transaction.
 * Transactions are executed synchronously and return a TransactionResult containing undo/redo operations.
 * 
 * This type is generally not used directly, instead an ObservableDatabase is used which is built on this.
 */
export interface TransactionDatastore<
    C extends CoreComponents = CoreComponents,
    A extends ArchetypeComponents<CoreComponents> = {},
    R extends ResourceComponents = {}
> extends ReadonlyDatastore<C, A, R> {
    execute(transaction: (db: Datastore<C, A, R>) => void): TransactionResult<C>;
}

export type TransactionCreateOperation<C> = {
    type: "create";
    values: EntityCreateValues<C>;
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
    | TransactionCreateOperation<C>
    | TransactionUpdateOperation<C>
    | TransactionDeleteOperation;

export interface TransactionResult<C> {
    readonly redo: TransactionWriteOperation<C>[];
    readonly undo: TransactionWriteOperation<C>[];
    readonly changedEntities: Set<Entity>;
    readonly changedComponents: Set<keyof C>;
    readonly changedArchetypes: Set<ArchetypeId>;
}
