import { Vec3 } from "@adobe/data/math";
import { TypedBuffer } from "@adobe/data/typed-buffer";

export type Volume<T> = {
    readonly size: Vec3;
    readonly data: TypedBuffer<T>;
};
export * as Volume from "./namespace.js";
