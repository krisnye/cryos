import type { TypedArray } from "./typed-array";

export type TypedArrayConstructor = (new (lengthOrArrayBuffer: number | ArrayBufferLike) => TypedArray) & { BYTES_PER_ELEMENT: number };
