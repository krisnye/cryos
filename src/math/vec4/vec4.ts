import { F32Schema } from "../../data/f32";
import type { FromSchema } from "../../data/schema/from-schema";
import type { Schema } from "../../data/schema/schema";

export const Vec4Schema = {
    type: 'array',
    items: F32Schema,
    minItems: 4,
    maxItems: 4,
    default: [0, 0, 0, 0] as [number, number, number, number],
} as const satisfies Schema;

export type Vec4 = FromSchema<typeof Vec4Schema>;

