import { fromProperties, Observe } from "data/observe";
import { useMemo } from "./use-memo.js";
import { useObservable } from "./use-observable.js";
import { Data } from "data/data.js";
  
export function useObservableValues<T extends Record<string,Observe<Data>>>(factory: () => T, deps: unknown[] = []): { [K in keyof T]: T[K] extends Observe<infer U> ? U : never } | undefined {
    const observable = useMemo(() => fromProperties(factory()), deps);
    return useObservable(observable);
}