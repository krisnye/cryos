import { Data } from "data";
import { Observe } from "data/observe";
import { createObservableState } from "data/observe/create-observable-state";
import { Extensions } from "ecs";
import { CoreComponents } from "ecs";
import { Database } from "ecs";

export function addObservableResources<
    C extends CoreComponents,
    E extends Extensions,
    R extends { [name: string]: Data }
>(
    db: Database<C, E>,
    resources: R
): Database<C, E & { resources: R, observe: { [K in keyof R]: Observe<R[K]> } }> {
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
}
