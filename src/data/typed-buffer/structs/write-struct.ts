import type { DataView32 } from "../../data-view-32/data-view-32";

export type WriteStruct<T> = (data: DataView32, index: number, value: T) => void;

