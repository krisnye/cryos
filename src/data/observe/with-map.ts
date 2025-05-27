import { Data } from "data/data";
import { Observe } from "./observe";

export function withMap<T, R>(observe: Observe<T>, map: (value: T) => R): Observe<R> {
    return (observer) => {
        const unobserve = observe((value) => {
            observer(map(value));
        });
        return unobserve;
    };
}
