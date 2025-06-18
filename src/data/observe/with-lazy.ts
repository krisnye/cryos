import { Observe } from "./observe";

/**
 * Creates a new Observe function that defers the creation of an expensive observable
 * until the first subscription. The created observable is cached and reused for
 * all subsequent subscriptions.
 */
export function withLazy<T>(factory: () => Observe<T>): Observe<T> {
    let cachedObservable: Observe<T> | null = null;
    
    return (observer) => {
        if (!cachedObservable) {
            cachedObservable = factory();
        }
        return cachedObservable(observer);
    };
} 