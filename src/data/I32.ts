import type { InferType } from "./Schema/InferType";
import type { Schema } from "./Schema/Schema";

export const I32Schema = {
    type: 'integer',
    minimum: -2147483648,
    maximum: 2147483647,
} as const satisfies Schema;

export type I32 = InferType<typeof I32Schema>;
