import type { InferType } from "./schema/infer-type";
import type { Schema } from "./schema/schema";

export const U32Schema = {
    type: 'integer',
    minimum: 0,
    maximum: 4294967295,
} as const satisfies Schema;

export type U32 = InferType<typeof U32Schema>;
