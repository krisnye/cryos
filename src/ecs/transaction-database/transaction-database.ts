import { Database, Entity } from "ecs";
import { CoreComponents } from "ecs/database/core-components";
import { ArchetypeComponents } from "ecs/database/archetype-components";
import { ResourceComponents } from "ecs/database/resource-components";
import { EntityUpdateValues, ReadonlyDatabase } from "ecs/database";
import { ArchetypeId, EntityCreateValues } from "ecs/archetype";

//  This is a sentinel value used to indicate a component should be deleted.
export const DELETE: unknown = "_$_DELETE_$_";

export interface TransactionDatabase<
    C extends CoreComponents = CoreComponents,
    A extends ArchetypeComponents<CoreComponents> = {},
    R extends ResourceComponents = {}
> extends ReadonlyDatabase<C, A, R> {
    execute(handler: (db: Database<C, A, R>) => void): TransactionResult<C>;
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
