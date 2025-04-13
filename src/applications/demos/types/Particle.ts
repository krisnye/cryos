import { Schema } from "../../../data/Schema";
import type { InferType } from "../../../data/Schema";
import { Vec3Schema } from "../../../data/Vec3/Vec3";
import { Vec4Schema } from "../../../data/Vec4/Vec4";

export const ParticleSchema = {
    type: 'object',
    properties: {
        position: Vec3Schema,
        color: Vec4Schema
    }
} as const satisfies Schema;

export type Particle = InferType<typeof ParticleSchema>;