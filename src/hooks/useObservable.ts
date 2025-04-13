// import { useState } from "./use-state.js";
// import { useEffect } from "./use-effect.js";
// import { Observable } from "../data/observables/index.js";

// export function useObservable<T>(observable: Observable<T>): T | undefined {
//     let [value, setValue] = useState<T | undefined>(undefined);
//     useEffect(() => {
//         return observable(newValue => {
//             setValue(value = newValue);
//         });
//     }, [observable]);
//     return value;
// }