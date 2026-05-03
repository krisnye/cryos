
import { Schema } from "@adobe/data/schema";
import { Vec3 } from "@adobe/data/math";

export const schema = {
    type: 'object',
    properties: {
        min: Vec3.schema,
        max: Vec3.schema,
    },
    required: ['min', 'max'],
    additionalProperties: false,
    default: {
        min: Vec3.schema.default,
        max: Vec3.schema.default,
    }
} as const satisfies Schema;

