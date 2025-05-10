
import { F32Schema } from "../../data/f32";
import type { InferType } from "../../data/schema/infer-type";
import type { Schema } from "../../data/schema/schema";

export const Vec2Schema = {
    type: 'array',
    items: F32Schema,
    minItems: 2,
    maxItems: 2,
    default: [0, 0] as [number, number],
} as const satisfies Schema;

export type Vec2 = InferType<typeof Vec2Schema>;

