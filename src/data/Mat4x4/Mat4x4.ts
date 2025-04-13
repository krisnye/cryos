import { F32Schema } from "../F32";
import type { InferType } from "../Schema/InferType";
import type { Schema } from "../Schema/Schema";

export const Mat4x4Schema = {
    type: 'array',
    items: F32Schema,
    minItems: 16,
    maxItems: 16,
} as const satisfies Schema;

export type Mat4x4 = InferType<typeof Mat4x4Schema>;
