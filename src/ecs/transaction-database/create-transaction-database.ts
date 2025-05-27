import { Database, EntityUpdateValues } from "ecs/database";
import { ArchetypeComponents } from "ecs/database/archetype-components";
import { CoreComponents } from "ecs/database/core-components";
import { ResourceComponents } from "ecs/database/resource-components";
import { DELETE, TransactionDatabase, TransactionResult, TransactionUpdateOperation, TransactionWriteOperation } from "./transaction-database";
import { ArchetypeId, EntityCreateValues } from "ecs/archetype";
import { createGetArchetypes } from "ecs/database/create-get-archetypes";
import { Entity } from "ecs";
import { Notify, Observe } from "data/observe";

export function createTransactionDatabase<
    C extends CoreComponents,
    A extends ArchetypeComponents<CoreComponents>,
    R extends ResourceComponents
>(
    db: Database<C, A, R>
): TransactionDatabase<C, A, R> {
    const {
        updateEntity: databaseUpdateEntity,
        deleteEntity: databaseDeleteEntity,
        archetypes: databaseArchetypes,
        getArchetype: databaseGetArchetype,
        getArchetypes: databaseGetArchetypes,
        ...rest
    } = db;

    const undoOperationsInReverseOrder: TransactionWriteOperation<C>[] = [];
    const redoOperations: TransactionWriteOperation<C>[] = [];
    const changed = {
        entities: new Set<Entity>(),
        components: new Set<keyof C>(),
        archetypes: new Set<ArchetypeId>(),
    };

    const archetypes = Object.fromEntries(
        Object.entries(databaseArchetypes).map(([name, archetype]) => {
            const { id, create, ...rest } = archetype;
            const transactionArchetype = {
                id,
                ...rest,
                create: (values: EntityCreateValues<C>) => {
                    const entity = archetype.create(values);
                    redoOperations.push({
                        type: "create",
                        values: values,
                    });
                    undoOperationsInReverseOrder.push({ type: "delete", entity });
                    changed.entities.add(entity);
                    changed.archetypes.add(id);
                    for (const key in values) {
                        changed.components.add(key as keyof C);
                    }
                    return entity;
                },
            };
            return [
                name,
                transactionArchetype
            ]
        })
    ) as any;

    const getArchetypes = createGetArchetypes(archetypes) as any;
    const getArchetype = (componentNames: (keyof C)[]) => {
        // create the archetype in the underlying database.
        const archetype = databaseGetArchetype(componentNames);
        // now we retrieve the version from the transaction database which has the create wrapper function.
        for (const archetype of getArchetypes(componentNames)) {
            if (archetype.components.size === componentNames.length) {
                return archetype;
            }
        }
        throw new Error();
    };

    const updateEntity = (entity: Entity, values: EntityUpdateValues<C>) => {
        const oldValues = db.selectEntity(entity)!;
        const replacedValues: any = {};
        for (const name in values) {
            let newValue = (values as any)[name];
            if (newValue === DELETE) {
                newValue = undefined;
            }
            let oldValue = (oldValues as any)[name];
            if (newValue !== oldValue) {
                if (oldValue === undefined) {
                    oldValue = DELETE;
                }
                replacedValues[name] = oldValue;
                changed.components.add(name as keyof C);
            }
        }

        changed.entities.add(entity);
        changed.archetypes.add(db.locateEntity(entity).archetype);
        databaseUpdateEntity(entity, values);
        //  archetype may have changed after update so we need to add new one.
        changed.archetypes.add(db.locateEntity(entity).archetype);

        maybeCombineUpdateOperations(undoOperationsInReverseOrder, redoOperations, entity, values, replacedValues);
    };

    const deleteEntity = (entity: Entity) => {
        changed.archetypes.add(db.locateEntity(entity).archetype);
        changed.entities.add(entity);
        const { id: _ignore, ...oldValues } = db.selectEntity(entity)! as any;
        for (const key in oldValues) {
            changed.components.add(key as keyof C);
        }
        databaseDeleteEntity(entity);
        redoOperations.push({ type: "delete", entity });
        undoOperationsInReverseOrder.push({ type: "create", values: oldValues });
    };

    const execute = (handler: (database: Database<C, A, R>) => void): TransactionResult<C> => {
        try {
            handler(db);
            const operations = {
                redo: [...redoOperations],
                undo: [...undoOperationsInReverseOrder.reverse()],
                changedEntities: changed.entities,
                changedComponents: changed.components,
                changedArchetypes: changed.archetypes,
            };
            return operations;
        }
        catch (error) {
            applyWriteOperations<C, A, R>(db, undoOperationsInReverseOrder.reverse());
            throw error;
        }
        finally {
            undoOperationsInReverseOrder.length = 0;
            redoOperations.length = 0;
            changed.entities.clear();
            changed.components.clear();
            changed.archetypes.clear();
        }
    };


    const transactionDatabase: Database<C, A, R> & TransactionDatabase<C, A, R> = {
        ...rest,
        archetypes,
        getArchetype,
        getArchetypes,
        updateEntity,
        deleteEntity,
        execute
    }

    return transactionDatabase;
}

function applyWriteOperations<
    C extends CoreComponents,
    A extends ArchetypeComponents<CoreComponents>,
    R extends ResourceComponents
>(database: Database<C, A, R>, operations: TransactionWriteOperation<C>[]): void {
    for (const operation of operations) {
        switch (operation.type) {
            case "create": {
                const archetype = database.getArchetype(["id", ...(Object.keys(operation.values) as (keyof C)[])]);
                archetype.create(operation.values);
                break;
            }
            case "update":
                database.updateEntity(operation.entity, operation.values);
                break;
            case "delete":
                database.deleteEntity(operation.entity);
                break;
        }
    }
}

function maybeCombineUpdateOperations<C>(
    undoOperationsInReverseOrder: TransactionWriteOperation<C>[],
    redoOperations: TransactionWriteOperation<C>[],
    entity: Entity,
    values: EntityUpdateValues<C>,
    replacedValues: EntityUpdateValues<C>
) {
    const lastUndoOperation: TransactionWriteOperation<C> | undefined =
        undoOperationsInReverseOrder[undoOperationsInReverseOrder.length - 1];
    if (
        lastUndoOperation?.type === "update" &&
        lastUndoOperation.entity === entity
    ) {
        const lastRedoOperation = redoOperations[
            redoOperations.length - 1
        ] as TransactionUpdateOperation<C>;
        lastRedoOperation.values = { ...lastRedoOperation.values, ...values };
        lastUndoOperation.values = {
            ...replacedValues,
            ...lastUndoOperation.values,
        };
    } else {
        redoOperations.push({ type: "update", entity, values });
        undoOperationsInReverseOrder.push({
            type: "update",
            entity,
            values: replacedValues,
        });
    }
}