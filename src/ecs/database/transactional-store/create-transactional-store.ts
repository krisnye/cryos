import { ArchetypeId, EntityInsertValues } from "../../archetype";
import { CoreComponents } from "../../core-components";
import { ResourceComponents } from "../../store/resource-components";
import { Store } from "../../store";
import { Entity } from "../../entity";
import { EntityUpdateValues } from "../../store/core";
import { TransactionalStore, TransactionResult, TransactionWriteOperation } from "./transactional-store";
import { StringKeyOf } from "types/string-key-of";

// Sentinel value used to indicate a component should be deleted
const DELETE: unknown = "_$_DELETE_$_";

export function createTransactionalStore<C extends CoreComponents, R extends ResourceComponents>(
    store: Store<C, R>,
): TransactionalStore<C, R> {

    // Transaction state (mutable during transaction execution)
    let undoOperationsInReverseOrder: TransactionWriteOperation<C>[] = [];
    let redoOperations: TransactionWriteOperation<C>[] = [];
    let changed = {
        entities: new Set<Entity>(),
        components: new Set<keyof C>(),
        archetypes: new Set<ArchetypeId>(),
    };

    // Wrap archetype creation to track operations
    const wrapArchetype = (archetype: any) => {
        const { id } = archetype;
        return {
            ...archetype,
            insert: (values: EntityInsertValues<C>) => {
                const entity = archetype.insert(values);
                redoOperations.push({
                    type: "insert",
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

    // Create wrapped archetypes for transaction tracking
    const wrappedArchetypes = new Map<ArchetypeId, any>();
    
    const getWrappedArchetype = (archetype: any) => {
        if (!wrappedArchetypes.has(archetype.id)) {
            wrappedArchetypes.set(archetype.id, wrapArchetype(archetype));
        }
        return wrappedArchetypes.get(archetype.id);
    };

    // Transaction-aware update function
    const updateEntity = (entity: Entity, values: EntityUpdateValues<C>) => {
        const oldValues = store.read(entity);
        if (!oldValues) {
            throw new Error(`Entity not found: ${entity}`);
        }

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
        const location = store.locate(entity);
        if (location) {
            changed.archetypes.add(location.archetype);
        }

        // Perform the actual update
        store.update(entity, values as any);

        // Check if archetype changed after update
        const newLocation = store.locate(entity);
        if (newLocation) {
            changed.archetypes.add(newLocation.archetype);
        }

        // Add operations with potential combining
        addUpdateOperationsMaybeCombineLast(undoOperationsInReverseOrder, redoOperations, entity, values, replacedValues);
    };

    // Transaction-aware delete function
    const deleteEntity = (entity: Entity) => {
        const location = store.locate(entity);
        if (location) {
            changed.archetypes.add(location.archetype);
        }
        changed.entities.add(entity);
        
        const oldValues = store.read(entity);
        if (!oldValues) {
            throw new Error(`Entity not found: ${entity}`);
        }

        const { id: _ignore, ...oldValuesWithoutId } = oldValues as any;
        for (const key in oldValuesWithoutId) {
            changed.components.add(key as keyof C);
        }

        store.delete(entity);
        redoOperations.push({ type: "delete", entity });
        undoOperationsInReverseOrder.push({ type: "insert", values: oldValuesWithoutId });
    };

    const resources = {} as { [K in keyof R]: R[K] };
    for (const name of Object.keys(store.resources)) {
        const resourceId = name as keyof C;
        const archetype = store.ensureArchetype(["id", resourceId] as StringKeyOf<C>[]);
        const entityId = archetype.columns.id.get(0);
        Object.defineProperty(resources, name, {
            get: Object.getOwnPropertyDescriptor(store.resources, name)!.get,
            set: (newValue) => {
                updateEntity(entityId, { [resourceId]: newValue } as any);
            },
            enumerable: true,
        });
    }


    // Create transaction-aware store
    const transactionStore: Store<C, R> = {
        ...store,
        resources,
        ensureArchetype: (componentNames) => {
            const archetype = store.ensureArchetype(componentNames);
            return getWrappedArchetype(archetype);
        },
        update: updateEntity,
        delete: deleteEntity,
    };

    // Execute transaction function
    const execute = (
        transactionFunction: (store: Store<C, R>) => Entity | void,
        options?: {
            transient?: boolean;
        }
    ): TransactionResult<C> => {
        // Reset transaction state
        undoOperationsInReverseOrder = [];
        redoOperations = [];
        changed.entities.clear();
        changed.components.clear();
        changed.archetypes.clear();

        try {
            // Execute the transaction
            const value = transactionFunction(transactionStore);

            // Return the transaction result
            const result: TransactionResult<C> = {
                value: value ?? undefined,
                transient: options?.transient ?? false,
                redo: [...redoOperations],
                undo: [...undoOperationsInReverseOrder.reverse()],
                changedEntities: new Set(changed.entities),
                changedComponents: new Set(changed.components),
                changedArchetypes: new Set(changed.archetypes),
            };

            return result;
        } catch (error) {
            // Rollback on error by applying undo operations in reverse
            applyWriteOperations(store, undoOperationsInReverseOrder.reverse());
            throw error;
        } finally {
            // Clean up transaction state
            undoOperationsInReverseOrder = [];
            redoOperations = [];
            changed.entities.clear();
            changed.components.clear();
            changed.archetypes.clear();
            wrappedArchetypes.clear();
        }
    };

    // Create the transactional store interface
    const transactionalStore: TransactionalStore<C, R> = {
        ...store,
        execute,
    };

    return transactionalStore as any;
}

// Helper function to combine update operations for the same entity
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
        // Combine with previous update operation
        const lastRedoOperation = redoOperations[redoOperations.length - 1];
        if (lastRedoOperation?.type === "update") {
            lastRedoOperation.values = { ...lastRedoOperation.values, ...values };
            lastUndoOperation.values = {
                ...replacedValues,
                ...lastUndoOperation.values,
            };
        }
    } else {
        // Add new update operations
        redoOperations.push({ type: "update", entity, values });
        undoOperationsInReverseOrder.push({
            type: "update",
            entity,
            values: replacedValues,
        });
    }
}

// Helper function to apply write operations for rollback
function applyWriteOperations<C extends CoreComponents, R extends ResourceComponents>(
    store: Store<C, R>, 
    operations: TransactionWriteOperation<C>[]
): void {
    for (const operation of operations) {
        switch (operation.type) {
            case "insert": {
                const componentNames = ["id", ...Object.keys(operation.values)] as StringKeyOf<C>[];
                const archetype = store.ensureArchetype(componentNames);
                archetype.insert(operation.values);
                break;
            }
            case "update":
                store.update(operation.entity, operation.values);
                break;
            case "delete":
                store.delete(operation.entity);
                break;
        }
    }
} 