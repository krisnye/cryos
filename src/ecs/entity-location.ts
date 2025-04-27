import { InferType, Schema, I32Schema } from "data";

export const EntityLocationSchema = {
    type: "object",
    properties: {
        archetype: I32Schema,
        row: I32Schema
    }
} as const satisfies Schema;

export type EntityLocation = InferType<typeof EntityLocationSchema>;
