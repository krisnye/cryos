import { FromSchema, Schema } from "@adobe/data/schema";
import { Vec2Schema } from "../vec2/vec2";

export const Line2Schema = {
    type: 'object',
    properties: {
        a: Vec2Schema,
        b: Vec2Schema,
    },
    required: ['a', 'b'],
    additionalProperties: false,
} as const satisfies Schema;

export type Line2 = FromSchema<typeof Line2Schema>;

