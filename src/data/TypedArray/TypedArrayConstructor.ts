import type { TypedArray } from "./TypedArray";

export type TypedArrayConstructor = (new (lengthOrArrayBuffer: number | ArrayBufferLike) => TypedArray) & { BYTES_PER_ELEMENT: number };
