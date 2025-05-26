import type { FromSchema, Schema } from "./schema";

export const F32Schema = {
    type: 'number',
    precision: 1,
    default: 0 as number,
} as const satisfies Schema;

export type F32 = FromSchema<typeof F32Schema>;
