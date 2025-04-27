import type { DataView32 } from "../../data-view-32/data-view-32";

export type ReadStruct<T> = (data: DataView32, index: number) => T;

