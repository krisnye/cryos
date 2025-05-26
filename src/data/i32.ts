import type { FromSchema } from "./schema/from-schema";
import type { Schema } from "./schema/schema";

export const I32Schema = {
    type: 'integer',
    minimum: -2147483648,
    maximum: 2147483647,
    default: 0 as number,
} as const satisfies Schema;

export type I32 = FromSchema<typeof I32Schema>;
