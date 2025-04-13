import type { DataView32 } from "../../DataView32";

export type WriteStruct<T> = (data: DataView32, index: number, value: T) => void;

