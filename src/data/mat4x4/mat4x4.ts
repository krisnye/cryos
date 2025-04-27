import { F32Schema } from "../f32";
import type { InferType } from "../schema/infer-type";
import type { Schema } from "../schema/schema";

export const Mat4x4Schema = {
    type: 'array',
    items: F32Schema,
    minItems: 16,
    maxItems: 16,
} as const satisfies Schema;

export type Mat4x4 = InferType<typeof Mat4x4Schema>;
