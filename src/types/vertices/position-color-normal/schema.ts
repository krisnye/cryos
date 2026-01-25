import { Schema } from "@adobe/data/schema";
import { Vec3, Vec4 } from "@adobe/data/math";

export const schema = {
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

