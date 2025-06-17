import { ArchetypeId } from "../archetype";
import { CoreComponents } from "../core-components";
import { ResourceComponents } from "../resource-components";
import { Store } from "../store";
import { Database, ToTransactionFunctions, TransactionDeclarations } from "./database";
import { Entity } from "../entity";
import { EntityValues } from "../store/core";
import { TransactionResult } from "./transactional-store";
import { mapEntries } from "data/object";
import { StringKeyOf } from "types/string-key-of";
import { Observe, withMap } from "data/observe";
import { createTransactionalStore } from "./transactional-store/create-transactional-store";
import { isPromise } from "../internal/is-promise";
import { isAsyncGenerator } from "ecs2/internal/is-async-provider";

export function createDatabase<
    C extends CoreComponents,
    R extends ResourceComponents,
    TD extends TransactionDeclarations<C, R>
>(
    ds: Store<C, R>,
    transactionDeclarations: TD,
): Database<C, R, ToTransactionFunctions<TD>> {
    type T = ToTransactionFunctions<TD>;

    const transactionalStore = createTransactionalStore(ds);

    //  variables to track the observers
    const componentObservers = new Map<StringKeyOf<C>, Set<() => void>>();
    const archetypeObservers = new Map<ArchetypeId, Set<() => void>>();
    const entityObservers = new Map<Entity, Set<(values: EntityValues<C> | null) => void>>();
    const transactionObservers = new Set<(transaction: TransactionResult<C>) => void>();

    //  observation interface
    const observeEntity = (entity: Entity) => (observer: (values: EntityValues<C> | null) => void) => {
        // Call immediately with current values
        observer(ds.read(entity));
        // Add to observers for future changes
        return addToMapSet(entity, entityObservers)(observer);
    };
    const observeArchetype = (archetype: ArchetypeId) => addToMapSet(archetype, archetypeObservers);
    const observeComponent = mapEntries(ds.componentSchemas, ([component]) => addToMapSet(component, componentObservers));
    
    // Resource observation - resources are stored as entities with specific archetypes
    const observeResource = Object.fromEntries(
        Object.entries(ds.resources).map(([resource]) => {
            const archetype = ds.ensureArchetype(["id" as StringKeyOf<C>, resource as unknown as StringKeyOf<C>]);
            const resourceId = archetype.columns.id.get(0);
            return [resource, withMap(observeEntity(resourceId), (values) => values?.[resource as unknown as StringKeyOf<C>])];
        })
    ) as { [K in StringKeyOf<R>]: Observe<R[K]>; };
    
    const observe: Database<C, R>["observe"] = {
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

    const { execute: transactionDatabaseExecute, resources, ...rest } = transactionalStore;

    const execute = (handler: (db: Store<C, R>) => void) => {
        const result = transactionDatabaseExecute(handler);
        
        // Notify transaction observers
        for (const transactionObserver of transactionObservers) {
            transactionObserver(result);
        }
        
        // Notify component observers
        for (const changedComponent of result.changedComponents) {
            const observers = componentObservers.get(changedComponent as StringKeyOf<C>);
            if (observers) {
                for (const observer of observers) {
                    observer();
                }
            }
        }
        
        // Notify archetype observers
        for (const changedArchetype of result.changedArchetypes) {
            const observers = archetypeObservers.get(changedArchetype);
            if (observers) {
                for (const observer of observers) {
                    observer();
                }
            }
        }
        
        // Notify entity observers
        for (const changedEntity of result.changedEntities) {
            const observers = entityObservers.get(changedEntity);
            if (observers) {
                const values = ds.read(changedEntity);
                for (const observer of observers) {
                    observer(values);
                }
            }
        }

        return result.value;
    }

    const transactions = {} as T;

    for (const [name, transactionUntyped] of Object.entries(transactionDeclarations)) {
        const transaction = transactionUntyped as (db: Store<C, R>, args: any) => void;
        Object.defineProperty(transactions, name, {
            value: (args: unknown) => {
                // Check if args is an AsyncArgsProvider function
                if (typeof args === 'function') {
                    const asyncArgsProvider = args as () => Promise<any> | AsyncGenerator<any>;
                    const asyncResult = asyncArgsProvider();
                    
                    if (isAsyncGenerator(asyncResult)) {
                        const asyncArgs = asyncResult;
                        function handleNext() {
                            asyncArgs.next().then(({ value, done }) => {
                                if (!done || value !== undefined) {
                                    execute(db => transaction(db, value));
                                }
                                if (done) {
                                    return;
                                };
                                handleNext(); // loop
                            }).catch(error => {
                                console.error('AsyncGenerator error:', error);
                            });
                        }
                        
                        handleNext();
                    }
                    else if (isPromise(asyncResult)) {
                        asyncResult.then(asyncArgs => execute((db) => transaction(db, asyncArgs)))
                            .catch(error => {
                                console.error('Promise error:', error);
                            });
                    }
                    else {
                        // Function returned a synchronous value
                        execute((db) => transaction(db, asyncResult));
                    }
                }
                else {
                    // Synchronous argument
                    return execute((db) => transaction(db, args));
                }
            },
            writable: false,
            enumerable: true,
            configurable: false
        });
    }

    // Return the complete observable store
    return {
        ...rest,
        resources,
        transactions,
        observe,
    } as Database<C, R, T>;
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
