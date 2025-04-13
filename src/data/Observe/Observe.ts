import { Notify } from "./Notify";
import { Unobserve } from "./Unobserve";

export type Observe<T> = (observer: Notify<T>) => Unobserve;
