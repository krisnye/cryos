import { F32Schema } from "../f32";
import type { InferType } from "../schema/infer-type";
import type { Schema } from "../schema/schema";

export const Vec3Schema = {
    type: 'array',
    items: F32Schema,
    minItems: 3,
    maxItems: 3,
} as const satisfies Schema;

export type Vec3 = InferType<typeof Vec3Schema>;
