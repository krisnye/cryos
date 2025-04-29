import { Data } from "data/data";
import { Notify } from "./notify";
import { Unobserve } from "./unobserve";

export type Observe<T extends Data = Data> = (observer: Notify<T>) => Unobserve;
