import { F32Schema } from "../../data/f32";
import type { InferType } from "../../data/schema/infer-type";
import type { Schema } from "../../data/schema/schema";

export const Vec4Schema = {
    type: 'array',
    items: F32Schema,
    minItems: 4,
    maxItems: 4,
    default: [0, 0, 0, 0] as [number, number, number, number],
} as const satisfies Schema;

export type Vec4 = InferType<typeof Vec4Schema>;

