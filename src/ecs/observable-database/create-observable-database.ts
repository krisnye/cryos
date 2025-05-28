import { Database, Entity } from "ecs";
import { ArchetypeComponents } from "ecs/database/archetype-components";
import { CoreComponents } from "ecs/database/core-components";
import { ResourceComponents } from "ecs/database/resource-components";
import { ObservableDatabase } from "./observable-datatabase";
import { TransactionDatabase } from "ecs/transaction-database/transaction-database";
import { Observe, withMap } from "data/observe";
import { mapEntries } from "data/object";
import { EntityValues } from "ecs/database/database";
import { TransactionResult } from "ecs/transaction-database/transaction-database";
import { ArchetypeId } from "ecs/archetype";

export function createObservableDatabase<
    C extends CoreComponents,
    A extends ArchetypeComponents<CoreComponents>,
    R extends ResourceComponents
>(db: TransactionDatabase<C, A, R>): ObservableDatabase<C, A, R> {

    //  variables to track the observers
    const componentObservers = new Map<keyof C, Set<() => void>>();
    const archetypeObservers = new Map<ArchetypeId, Set<() => void>>();    
    const entityObservers = new Map<Entity, Set<(values: EntityValues<C> | null) => void>>();
    const transactionObservers = new Set<(transaction: TransactionResult<C>) => void>();
    
    //  observation interface
    const observeEntity = (entity: Entity) => (observer: (values: EntityValues<C> | null) => void) => {
        // Call immediately with current values
        observer(db.selectEntity(entity));
        // Add to observers for future changes
        return addToMapSet(entity, entityObservers)(observer);
    };
    const observeArchetype = (archetype: ArchetypeId) => addToMapSet(archetype, archetypeObservers);
    const observeComponent = mapEntries(db.components, ([component]) => addToMapSet(component, componentObservers));
    const observeResource = mapEntries(db.resources, ([resource]) => {
        const archetype = db.getArchetype(["id", resource as keyof C]);
        const resourceId = archetype.columns.id.get(0);
        return withMap(observeEntity(resourceId), (values) => values![resource as keyof C]);
    }) as unknown as { [K in keyof R]: Observe<R[K]>; };
    const observe: ObservableDatabase<C, A, R>["observe"] = {
        component: observeComponent,
        resource: observeResource,
        transactions: (notify) => {
            transactionObservers.add(notify);
            return () => {
                transactionObservers.delete(notify);
            }
        },
        entity: observeEntity,
        archetype: observeArchetype,
    };

    const { execute: transactionDatabaseExecute, ...rest } = db;

    const execute = (handler: (db: Database<C, A, R>) => void) => {
        const result = transactionDatabaseExecute(handler);
        for (const transactionObserver of transactionObservers) {
            transactionObserver(result);
        }
        for (const changedComponents of result.changedComponents) {
            const observers = componentObservers.get(changedComponents);
            if (observers) {
                for (const observer of observers) {
                    observer();
                }
            }
        }
        for (const changedArchetype of result.changedArchetypes) {
            const observers = archetypeObservers.get(changedArchetype);
            if (observers) {
                for (const observer of observers) {
                    observer();
                }
            }
        }
        for (const changedEntity of result.changedEntities) {
            const observers = entityObservers.get(changedEntity);
            if (observers) {
                const values = db.selectEntity(changedEntity);
                for (const observer of observers) {
                    observer(values);
                }
            }
        }

        //  notify the observers based upon what was changed in the transaction.
        return result;
    }

    return {
        ...rest,
        observe,
        execute
    }
}

const emptySet: ReadonlySet<() => void> = new Set();

const addToMapSet = <K, T>(key: K, map: Map<K, Set<T>>) => (value: T) => {
    let set = map.get(key);
    if (set) {
        set.add(value);
    } else {
        map.set(key, (set = new Set([value])));
    }
    return () => {
        set!.delete(value);
    };
};
