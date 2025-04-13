import { F32Schema } from "../../../data/F32";
import { Mat4x4Schema } from "../../../data/Mat4x4/Mat4x4";
import { Schema, InferType } from "../../../data/Schema";
import { Vec3Schema } from "../../../data/Vec3/Vec3";


export const SceneSchema = {
    type: 'object',
    properties: {
        // The order of the properties matters and must match the shader code
        viewProjection: Mat4x4Schema,
        lightDirection: Vec3Schema,
        lightColor: Vec3Schema,
        ambientStrength: F32Schema,
    }
} as const satisfies Schema;

export type Scene = InferType<typeof SceneSchema>;
