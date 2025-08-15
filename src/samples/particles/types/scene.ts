import { F32Schema, FromSchema, Schema } from "@adobe/data/schema";
import { Mat4x4Schema, Vec3Schema } from "math/index.js";

export const SceneSchema = {
    type: 'object',
    properties: {
        // The order of the properties matters and must match the shader code
        viewProjection: Mat4x4Schema,
        lightDirection: Vec3Schema,
        lightColor: Vec3Schema,
        ambientStrength: F32Schema,
        time: F32Schema, // Add time for animation
    },
    required: ["viewProjection", "lightDirection", "lightColor", "ambientStrength", "time"],
    additionalProperties: false,
} as const satisfies Schema;

export type Scene = FromSchema<typeof SceneSchema>;
