import { F32Schema, FromSchema, Schema, U32Schema } from "@adobe/data/schema";

export const StaticVoxelSchema = {
    type: "object",
    properties: {
        flags: U32Schema,
        type: U32Schema,
        damage: F32Schema,
        temp: F32Schema,
    },
} as const satisfies Schema;

export type StaticVoxel = FromSchema<typeof StaticVoxelSchema>;
