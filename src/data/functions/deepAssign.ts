
type DeepAssignable = { [key: string]: DeepAssignable | unknown };

/**
 * Deeply assigns properties from source into target, throwing an error if attempting to overwrite any non-object value.
 * Objects are merged recursively, but primitive values cannot be overwritten.
 * Mutates the target object directly.
 * 
 * @param target The target object to assign into
 * @param source The source object to assign from
 * @returns The modified target object
 * @throws Error if attempting to overwrite a non-object value
 */
export function deepAssign<T, S>(
    target: T,
    source: S
): T & S {
    if (source !== undefined) {
        for (const key in source) {
            const targetValue = target[key as any];
            const sourceValue = source[key];

            const isTargetObject = targetValue && typeof targetValue === 'object';
            const isSourceObject = sourceValue && typeof sourceValue === 'object' && !Array.isArray(sourceValue);

            if (sourceValue !== undefined) {
                if (key in (target as any)) {
                    if (isTargetObject && isSourceObject) {
                        deepAssign(
                            targetValue as DeepAssignable,
                            sourceValue as DeepAssignable
                        );
                    } else if (targetValue !== undefined) {
                        throw new Error(
                            `Cannot overwrite existing value at path "${key}". ` +
                            `Existing value: ${JSON.stringify(targetValue)}, ` +
                            `New value: ${JSON.stringify(sourceValue)}`
                        );
                    } else {
                        (target as any)[key] = sourceValue;
                    }
                } else {
                    (target as any)[key] = sourceValue;
                }
            }
        }
    }

    return target as T & S;
} 