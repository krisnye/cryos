import { Data } from "data/data";
import { Observe } from "./observe";

export function fromProperties<T extends Record<string, Observe<Data>>>(properties: T): Observe<{
    [K in keyof T]: T[K] extends Observe<infer U> ? U : never;
}> {
    type Result = { [K in keyof T]: T[K] extends Observe<infer U> ? U : never };
    return (observer) => {
        const totalProperties = Object.keys(properties).length;
        // If there are no properties, emit empty object immediately
        if (totalProperties === 0) {
            observer({} as Result);
            return () => {};
        }

        const values = new Map<keyof T, T[keyof T] extends Observe<infer U> ? U : never>();
        const unobserves: (() => void)[] = [];

        // Subscribe to each property
        for (const [key, observable] of Object.entries(properties) as [keyof T, T[keyof T]][]) {
            const unobserve = observable((value) => {
                // Type assertion to ensure value matches the expected type
                values.set(key, value as T[typeof key] extends Observe<infer U> ? U : never);
                
                // Only emit if we have all values
                if (values.size === totalProperties) {
                    const result = Object.fromEntries(values) as Result;
                    observer(result);
                }
            });
            unobserves.push(unobserve);
        }

        // Return a function to unsubscribe from all observables
        return () => {
            for (const unobserve of unobserves) {
                unobserve();
            }
        };
    };
}