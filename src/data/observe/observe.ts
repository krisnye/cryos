import { Notify } from "./notify";
import { Unobserve } from "./unobserve";

export type Observe<T> = (observer: Notify<T>) => Unobserve;
