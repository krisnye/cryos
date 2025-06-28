import { FromSchema, Schema } from "@adobe/data/schema";
import { Vec3Schema, Vec4Schema } from "math/index.js";

export const ParticleSchema = {
    type: 'object',
    properties: {
        position: Vec3Schema,
        color: Vec4Schema
    },
    required: ["position", "color"],
    additionalProperties: false
} as const satisfies Schema;

export type Particle = FromSchema<typeof ParticleSchema>;
