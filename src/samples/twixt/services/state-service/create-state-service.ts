import { Data } from "data";
import { Observe } from "data/observe";
import { createObservableState } from "data/observe/create-observable-state";
import { createDatabase } from "ecs";

export type Player = "red" | "black";
export type BoardPoint = Player | null;
export type BoardLink = [number, number]; // [fromIndex, toIndex]

// temporarily removed from ECS 
export const observableResources = <R extends { readonly [name: string]: Data }>(resources: R)
: { resources: { -readonly [K in keyof R]: R[K] }, observe: { [K in keyof R]: Observe<R[K]> } } => {
    const db = {
        resources: {} as { -readonly [K in keyof R]: R[K] },
        observe: {} as { [K in keyof R]: Observe<R[K]> },
    }
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
    return db;
}

export function createStateService() {
    return createDatabase().withResources({
        board: new Array<BoardPoint>(24 ** 2).fill(null),
        links: new Array<BoardLink>(0),
        hoverIndex: null as number | null,
    }).toObservable();
}
