import { FromSchema, Schema, U32Schema } from "data";

export const EntityLocationSchema = {
    type: "object",
    properties: {
        archetype: U32Schema,
        row: U32Schema
    }
} as const satisfies Schema;

export type EntityLocation = FromSchema<typeof EntityLocationSchema>;
