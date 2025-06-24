import { FromSchema, Schema } from "@adobe/data/schema";

export const FrameSchema = {
    type: "object",
    properties: {
        count: { type: "number", default: 0 },
    },
    required: ["count"],
    additionalProperties: false,
    default: { count: 0 as number },
    transient: true,
} as const satisfies Schema;

export type Frame = FromSchema<typeof FrameSchema>;
