import { Datastore, Entity } from "ecs";
import { ArchetypeComponents } from "ecs/datastore/archetype-components";
import { CoreComponents } from "ecs/datastore/core-components";
import { ResourceComponents } from "ecs/datastore/resource-components";
import { Database } from "./database";
import { TransactionDatastore, TransactionDeclarations, TransactionFunctions } from "ecs/datastore/transaction/transaction-datastore";
import { fromProperties, Observe, withDeduplicate, withMap } from "data/observe";
import { mapEntries } from "data/object";
import { EntityValues } from "ecs/datastore/datastore";
import { TransactionResult } from "ecs/datastore/transaction/transaction-datastore";
import { ArchetypeId } from "ecs/archetype";

export function createDatabase<
    C extends CoreComponents,
    A extends ArchetypeComponents<CoreComponents>,
    R extends ResourceComponents,
    T extends TransactionFunctions,
>(db: TransactionDatastore<C, A, R>): Database<C, A, R, T> {

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
    const observeResource = mapEntries(db.resources as any, ([resource]) => {
        const archetype = db.getArchetype(["id", resource as keyof C]);
        const resourceId = archetype.columns.id.get(0);
        return withMap(observeEntity(resourceId), (values) => values![resource as keyof C]);
    }) as unknown as { [K in keyof R]: Observe<R[K]>; };
    const observe: Database<C, A, R>["observe"] = {
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

    const { execute: transactionDatabaseExecute, resources, ...rest } = db;

    const execute = (handler: (db: Datastore<C, A, R>) => void) => {
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

    const transactions = {} as T;

    const withTransactions = <NT extends TransactionDeclarations<C, A, R>>(newTransactions: NT): any => {
        for (const [name, transaction] of Object.entries(newTransactions)) {
            Object.defineProperty(transactions, name, {
                value: (args: unknown) => {
                    execute((db) => transaction(db, args as any));
                },
                writable: false,
                enumerable: true,
                configurable: false
            });
        }
        return observableDatabase;
    }

    const withComputedResource = <N extends string, const D extends readonly (keyof R)[], CT>(name: N, dependencies: D, compute: (resources: { [K in D[number]]: R[K] }) => CT): any => {
        Object.defineProperty(resources, name, {
            get: () => {
                return compute(Object.fromEntries(dependencies.map((resource) => [resource, db.resources[resource]])) as any);
            },
            enumerable: true,
            configurable: false,
        });
        Object.defineProperty(observe.resource, name, {
            value: withDeduplicate(
                withMap(
                    fromProperties(
                        Object.fromEntries(
                            dependencies.map((resource) => [resource, observe.resource[resource]])
                        ),
                    ) as any,
                    compute
                )
            ),
            enumerable: true,
            configurable: false,
        });
        return observableDatabase;
    }

    const observableDatabase: Database<C, A, R, T> = {
        ...rest,
        resources,
        transactions,
        observe,
        execute,
        withTransactions,
        withComputedResource,
    };

    return observableDatabase;
}

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
