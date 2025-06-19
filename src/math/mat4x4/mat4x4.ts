import { F32Schema, Schema, FromSchema } from "@adobe/data/schema";

export const Mat4x4Schema = {
    type: 'array',
    items: F32Schema,
    minItems: 16,
    maxItems: 16,
} as const satisfies Schema;

export type Mat4x4 = FromSchema<typeof Mat4x4Schema>;

export type Mat4x4Index = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15;
