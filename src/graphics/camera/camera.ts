import { F32Schema, FromSchema, Schema } from "@adobe/data/schema";
import { Vec3Schema } from "math/index.js";

export const CameraSchema = {
    type: 'object',
    properties: {
        aspect: F32Schema,
        fieldOfView: F32Schema,
        nearPlane: F32Schema,
        farPlane: F32Schema,
        position: Vec3Schema,
        target: Vec3Schema,
        up: Vec3Schema,
    },
    required: ["aspect", "fieldOfView", "nearPlane", "farPlane", "position", "target", "up"],
    additionalProperties: false,
} as const satisfies Schema;

export type Camera = FromSchema<typeof CameraSchema>;
