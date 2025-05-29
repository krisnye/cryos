import { Database, EntityUpdateValues } from "ecs/database";
import { ArchetypeComponents } from "ecs/database/archetype-components";
import { CoreComponents } from "ecs/database/core-components";
import { ResourceComponents } from "ecs/database/resource-components";
import { TransactionDatabase, TransactionResult, TransactionUpdateOperation, TransactionWriteOperation } from "./transaction-database";
import { Archetype, ArchetypeId, EntityCreateValues } from "ecs/archetype";
import { createGetArchetypes } from "ecs/database/create-get-archetypes";
import { Entity } from "ecs";
import { applyWriteOperations } from "./apply-write-operations";

//  This is a sentinel value used to indicate a component should be deleted.
const DELETE: unknown = "_$_DELETE_$_";

export function createTransactionDatabase<
    C extends CoreComponents,
    A extends ArchetypeComponents<CoreComponents>,
    R extends ResourceComponents
>(
    db: Database<C, A, R>
): TransactionDatabase<C, A, R> {
    const {
        archetypes: databaseArchetypes,
        resources: databaseResources,
        updateEntity: databaseUpdateEntity,
        deleteEntity: databaseDeleteEntity,
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

    const resources = {} as { [K in keyof R]: R[K] };
    for (const name of Object.keys(db.resources)) {
        const resourceId = name as keyof C;
        const archetype = db.getArchetype(["id", resourceId]);
        const entityId = archetype.columns.id.get(0);
        Object.defineProperty(resources, name, {
            get: () => archetype.columns[resourceId]!.get(0),
            set: (newValue) => {
                updateEntity(entityId, { [resourceId]: newValue } as any);
            },
            enumerable: true,
        });
    }
    const wrapArchetype = (archetype: Archetype<CoreComponents & Pick<C, A[string][number]>>) => {
        const { id } = archetype;
        return {
            ...archetype,
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
    };

    const archetypesLookup = Object.fromEntries(
        Object.entries(databaseArchetypes).map(([name, archetype]) => {
            return [
                name,
                wrapArchetype(archetype)
            ]
        })
    ) as any;
    const archetypes = Object.assign(Object.values(archetypesLookup), archetypesLookup);

    const getArchetypes = createGetArchetypes(archetypes) as any;
    const getArchetype = (componentNames: (keyof C)[]) => {
        // create the archetype in the underlying database.
        const archetype = databaseGetArchetype(componentNames);
        const newlyAdded = db.archetypes.length > archetypes.length;
        if (newlyAdded) {
            const newArchetype = wrapArchetype(archetype as any);
            archetypes.push(newArchetype);
        }
        // now we retrieve the version from the transaction database which has the create wrapper function.
        for (const archetype of getArchetypes(componentNames)) {
            if (archetype.components.size === componentNames.length) {
                return archetype;
            }
        }
        throw new Error(`Archetype not found: ${componentNames.join(", ")}`);
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

        addUpdateOperationsMaybeCombineLast(undoOperationsInReverseOrder, redoOperations, entity, values, replacedValues);
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
            handler(transactionDatabase);
            const operations = {
                redo: [...redoOperations],
                undo: [...undoOperationsInReverseOrder.reverse()],
                changedEntities: new Set(changed.entities),
                changedComponents: new Set(changed.components),
                changedArchetypes: new Set(changed.archetypes),
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
        resources,
        archetypes,
        getArchetype,
        getArchetypes,
        updateEntity,
        deleteEntity,
        execute,
    }

    return transactionDatabase;
}

function addUpdateOperationsMaybeCombineLast<C>(
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