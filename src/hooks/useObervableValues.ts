// import { fromObservableProperties, Observable } from "../data/observables/index.js";
// import { useMemo } from "../hooks/use-memo.js";
// import { useObservable } from "./use-observable";
  
// export function useObservableValues<T extends Record<string,Observable>>(factory: () => T, deps: unknown[] = []): { [K in keyof T]: T[K] extends Observable<infer U> ? U : never } | undefined {
//     const observable = useMemo(() => fromObservableProperties(factory()), deps);
//     return useObservable(observable);
// }