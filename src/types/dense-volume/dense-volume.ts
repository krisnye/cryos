import { Vec3 } from "@adobe/data/math";
import { TypedBuffer } from "@adobe/data/typed-buffer";

export type DenseVolume<T> = {
    readonly type: "dense";
    readonly size: Vec3;
    readonly data: TypedBuffer<T>;
};
export * as DenseVolume from "./namespace.js";

