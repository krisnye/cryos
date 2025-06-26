import { FromSchema, Schema, U32Schema } from "@adobe/data/schema";

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
