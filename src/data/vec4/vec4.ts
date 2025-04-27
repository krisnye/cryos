import { F32Schema } from "../f32";
import type { InferType } from "../schema/infer-type";
import type { Schema } from "../schema/schema";

export const Vec4Schema = {
    type: 'array',
    items: F32Schema,
    minItems: 4,
    maxItems: 4,
} as const satisfies Schema;

export type Vec4 = InferType<typeof Vec4Schema>;

