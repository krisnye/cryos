import { F32Schema } from "../F32";
import type { InferType } from "../Schema/InferType";
import type { Schema } from "../Schema/Schema";

export const Vec3Schema = {
    type: 'array',
    items: F32Schema,
    minItems: 3,
    maxItems: 3,
} as const satisfies Schema;

export type Vec3 = InferType<typeof Vec3Schema>;
