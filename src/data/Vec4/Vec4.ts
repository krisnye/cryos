import { F32Schema } from "../F32";
import type { InferType } from "../Schema/InferType";
import type { Schema } from "../Schema/Schema";

export const Vec4Schema = {
    type: 'array',
    items: F32Schema,
    minItems: 4,
    maxItems: 4,
} as const satisfies Schema;

export type Vec4 = InferType<typeof Vec4Schema>;

