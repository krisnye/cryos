import { F32Schema, InferType, Schema, U32Schema } from "data";

export const StaticVoxelSchema = {
    type: "object",
    properties: {
        flags: U32Schema,
        type: U32Schema,
        damage: F32Schema,
        temp: F32Schema,
    },
} as const satisfies Schema;

export type StaticVoxel = InferType<typeof StaticVoxelSchema>;
