/**
 * MIT License
 * 
 * Copyright (c) 2025 Kris Nye
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

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
            const targetValue = (target as any)[key as any];
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