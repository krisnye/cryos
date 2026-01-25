import { Schema } from "@adobe/data/schema";
import { Vec3, U32 } from "@adobe/data/math";

export const schema = {
    type: "object",
    properties: {
        position: Vec3.schema,
        normal: Vec3.schema,
        materialIndex: U32.schema,
    },
    required: ["position", "normal", "materialIndex"],
    additionalProperties: false,
    layout: "packed",
} as const satisfies Schema;

