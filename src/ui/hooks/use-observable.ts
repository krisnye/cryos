import { useState } from "./use-state.js";
import { useEffect } from "./use-effect.js";
import { Observe } from "data/observe";

export function useObservable<T>(observable: Observe<T>): T | undefined {
    let [value, setValue] = useState<T | undefined>(undefined);
    useEffect(() => {
        return observable(newValue => {
            setValue(value = newValue);
        });
    }, [observable]);
    return value;
}