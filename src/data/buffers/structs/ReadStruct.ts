import type { DataView32 } from "../../DataView32";

export type ReadStruct<T> = (data: DataView32, index: number) => T;

