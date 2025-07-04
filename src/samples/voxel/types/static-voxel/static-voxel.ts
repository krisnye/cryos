import { F32Schema, FromSchema, Schema, U32Schema } from "@adobe/data/schema";

export const StaticVoxelSchema = {
    type: "object",
    properties: {
        flags: U32Schema,
        type: U32Schema,
        damage: F32Schema,
        temp: F32Schema,
        height: U32Schema, // height in column, x, y provided by map
    },
    required: ["flags", "type", "damage", "temp", "height"],
    additionalProperties: false,
} as const satisfies Schema;

export type StaticVoxel = FromSchema<typeof StaticVoxelSchema>;
