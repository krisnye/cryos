import { F32Schema } from "../../data/f32";
import type { InferType } from "../../data/schema/infer-type";
import type { Schema } from "../../data/schema/schema";

export const Vec3Schema = {
    type: 'array',
    items: F32Schema,
    minItems: 3,
    maxItems: 3,
} as const satisfies Schema;

export type Vec3 = InferType<typeof Vec3Schema>;
