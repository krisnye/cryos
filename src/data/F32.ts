import type { InferType, Schema } from "./Schema";

export const F32Schema = {
    type: 'number',
    precision: 1,
} as const satisfies Schema;

export type F32 = InferType<typeof F32Schema>;
