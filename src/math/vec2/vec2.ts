import { F32Schema, Schema, FromSchema } from "@adobe/data/schema";

export const Vec2Schema = {
    type: 'array',
    items: F32Schema,
    minItems: 2,
    maxItems: 2,
    default: [0, 0] as [number, number],
} as const satisfies Schema;

export type Vec2 = FromSchema<typeof Vec2Schema>;

