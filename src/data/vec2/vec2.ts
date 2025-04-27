import { F32Schema } from "../f32";
import type { InferType } from "../schema/infer-type";
import type { Schema } from "../schema/schema";

export const Vec2Schema = {
    type: 'array',
    items: F32Schema,
    minItems: 2,
    maxItems: 2,
} as const satisfies Schema;

export type Vec2 = InferType<typeof Vec2Schema>;

