import { F32Schema } from "../../data/f32";
import type { FromSchema } from "../../data/schema/from-schema";
import type { Schema } from "../../data/schema/schema";

export const Vec3Schema = {
    type: 'array',
    items: F32Schema,
    minItems: 3,
    maxItems: 3,
    default: [0, 0, 0] as [number, number, number],
} as const satisfies Schema;

export type Vec3 = FromSchema<typeof Vec3Schema>;
