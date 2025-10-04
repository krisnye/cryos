import { Vec3, Vec4 } from "@adobe/data/math";
import { FromSchema, Schema } from "@adobe/data/schema";
import { getStructLayout } from "@adobe/data/typed-buffer";

export const positionColorNormalVertexSchema = {
    type: "object",
    properties: {
        position: Vec3.schema,
        color: Vec4.schema,
        normal: Vec3.schema,
    },
    required: ["position", "color", "normal"],
    additionalProperties: false,
    layout: "packed",
} as const satisfies Schema;

export type PositionColorNormalVertex = FromSchema<typeof positionColorNormalVertexSchema>;

export const positionColorNormalVertexLayout = getStructLayout(positionColorNormalVertexSchema);