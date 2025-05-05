import { Data } from "data";
import { Observe } from "data/observe";
import { createObservableState } from "data/observe/create-observable-state";
import { Extensions } from "ecs";
import { CoreComponents } from "ecs";
import { Database } from "ecs";

export const observableResources = <R extends { readonly [name: string]: Data }>(resources: R) => {
    return <C extends CoreComponents, E extends Extensions>(
        db: Database<C, E>
    ): Database<C, E & { resources: { -readonly [K in keyof R]: R[K] }, observe: { [K in keyof R]: Observe<R[K]> } }> => {
        for (const [name, resource] of Object.entries(resources) as [keyof R, R[keyof R]][]) {
            let currentValue: R[keyof R] = (db.resources as any)[name] ?? resource;
            const [observe, setValue] = createObservableState(currentValue);
            Object.defineProperty(db.resources, name, {
                get: () => {
                    return currentValue;
                },
                set: (newValue) => {
                    setValue(currentValue = newValue);
                },
                enumerable: true,
                configurable: false,
            })
            Object.defineProperty(db.observe, name, {
                value: observe,
                enumerable: true,
                configurable: false,
            })
        }
        return db as any;
    };
}