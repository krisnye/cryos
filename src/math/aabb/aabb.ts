import { FromSchema, Schema } from "@adobe/data/schema";
import { Vec3Schema } from "math/vec3/vec3.js";

export const AabbSchema = {
    type: 'object',
    properties: {
        min: Vec3Schema,
        max: Vec3Schema,
    },
    required: ['min', 'max'],
    additionalProperties: false,
    default: {
        min: Vec3Schema.default,
        max: Vec3Schema.default,
    }
} as const satisfies Schema;

export type Aabb = FromSchema<typeof AabbSchema>;
