import { F32 } from "@adobe/data/math";

export type GridWorldScale = {
    readonly particleSize: F32;
    readonly blockSize: F32;
    readonly chunkSize: F32;
};

export * as GridWorldScale from "./public.js";