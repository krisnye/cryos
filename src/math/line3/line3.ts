import { FromSchema, Schema } from "@adobe/data/schema";
import { Vec3Schema } from "../vec3/vec3.js";

export const Line3Schema = {
    type: 'object',
    properties: {
        a: Vec3Schema,
        b: Vec3Schema,
    },
    required: ['a', 'b'],
    additionalProperties: false,
} as const satisfies Schema;

export type Line3 = FromSchema<typeof Line3Schema>; 