import { F32Schema, Schema, FromSchema } from "@adobe/data/schema";
import { getStructLayout } from "@adobe/data/typed-buffer";

export const Vec3Schema = {
    type: 'array',
    items: F32Schema,
    minItems: 3,
    maxItems: 3,
    default: [0, 0, 0] as readonly [number, number, number],
} as const satisfies Schema;

export type Vec3 = FromSchema<typeof Vec3Schema>;
export const Vec3Layout = getStructLayout(Vec3Schema);
