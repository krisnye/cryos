import { F32Schema, FromSchema, Schema, U32Schema } from "data";

export const VoxelColumnSchema = {
    type: "object",
    properties: {
        staticColumnBase: U32Schema,
        staticColumnHeight: U32Schema,
        staticColumnDataIndex: U32Schema,
        dynamicColumnHeight: U32Schema,
    },
} as const satisfies Schema;

export type VoxelColumn = FromSchema<typeof VoxelColumnSchema>;
