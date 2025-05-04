/**
 * Creates a deep mutable clone of a value while preserving its type structure.
 * This is useful when you need to work with a mutable copy of an immutable data structure.
 */
export const mutableClone = <T>(value: T): T => {
    if (value === null || typeof value !== 'object') {
        return value;
    }

    if (Array.isArray(value)) {
        return value.map(item => mutableClone(item)) as T;
    }

    const result = {} as T;
    for (const key in value) {
        if (Object.prototype.hasOwnProperty.call(value, key)) {
            result[key] = mutableClone(value[key]);
        }
    }

    return result;
}; 