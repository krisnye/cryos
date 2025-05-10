import type { InferType, Schema } from "./schema";

export const F32Schema = {
    type: 'number',
    precision: 1,
    default: 0 as number,
} as const satisfies Schema;

export type F32 = InferType<typeof F32Schema>;
