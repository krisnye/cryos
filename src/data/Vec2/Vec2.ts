import { F32Schema } from "../F32";
import type { InferType } from "../Schema/InferType";
import type { Schema } from "../Schema/Schema";

export const Vec2Schema = {
    type: 'array',
    items: F32Schema,
    minItems: 2,
    maxItems: 2,
} as const satisfies Schema;

export type Vec2 = InferType<typeof Vec2Schema>;

