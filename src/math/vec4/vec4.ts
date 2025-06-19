import { F32Schema, Schema, FromSchema } from "@adobe/data/schema";

export const Vec4Schema = {
    type: 'array',
    items: F32Schema,
    minItems: 4,
    maxItems: 4,
    default: [0, 0, 0, 0] as [number, number, number, number],
} as const satisfies Schema;

export type Vec4 = FromSchema<typeof Vec4Schema>;

