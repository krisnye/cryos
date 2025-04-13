import { Schema } from "../../../data/Schema";
import type { InferType } from "../../../data/Schema";
import { Vec4Schema } from "../../../data/Vec4/Vec4";

export const AtomSchema = {
    type: 'object',
    properties: {
        velocityMass: Vec4Schema,
        positionTemperature: Vec4Schema,
    }
} as const satisfies Schema;

export type Atom = InferType<typeof AtomSchema>;