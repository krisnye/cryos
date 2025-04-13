import { InferType, Schema } from "../Schema";
import { I32Schema } from "../I32";

export const EntityLocationSchema = {
    type: "object",
    properties: {
        archetype: I32Schema,
        row: I32Schema
    }
} as const satisfies Schema;

export type EntityLocation = InferType<typeof EntityLocationSchema>;
