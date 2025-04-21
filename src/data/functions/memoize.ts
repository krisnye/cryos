
/**
 * Memoizes a single argument function.
 * @param fn - The function to memoize.
 * @returns A memoized version of the function.
 */
export function memoize<K,V>(fn: (key: K) => V): (key: K) => V {
    const cache = new Map<K, V>();
    return (key: K): V => {
        if (cache.has(key)) {
            return cache.get(key)!;
        }
        const value = fn(key);
        cache.set(key, value);
        return value;
    }
}
