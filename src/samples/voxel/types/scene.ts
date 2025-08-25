import { F32Schema, FromSchema, Schema, U32Schema } from "@adobe/data/schema";
import { Mat4x4Schema, Vec3Schema } from "math/index.js";

export const SceneSchema = {
    type: 'object',
    properties: {
        // The order of the properties matters and must match the shader code
        viewProjection: Mat4x4Schema,
        lightDirection: Vec3Schema,
        ambientStrength: F32Schema, // this will be packed right after lightDirection
        lightColor: Vec3Schema,
        time: F32Schema,  // this will be packed right after lightColor
        hoverPosition: Vec3Schema,
        hoverFace: U32Schema,
    },
    required: ["viewProjection", "lightDirection", "lightColor", "ambientStrength", "time", "hoverPosition", "hoverFace"],
    additionalProperties: false,
} as const satisfies Schema;

export type Scene = FromSchema<typeof SceneSchema>;
