import type { InferType } from "./Schema/InferType";
import type { Schema } from "./Schema/Schema";

export const U32Schema = {
    type: 'integer',
    minimum: 0,
    maximum: 4294967295,
} as const satisfies Schema;

export type U32 = InferType<typeof U32Schema>;
