import { F32, Vec3 } from "@adobe/data/math";
import { Schema } from "@adobe/data/schema";

export const schema = {
    type: 'object',
    properties: {
        aspect: F32.schema,
        fieldOfView: F32.schema,
        nearPlane: F32.schema,
        farPlane: F32.schema,
        position: Vec3.schema,
        // when interpolating between perspective and orthographic, the target indicates the focal plane
        // that we fix as the frustrum closer expands and the frustrum further contracts
        target: Vec3.schema,
        up: Vec3.schema,
        orthographic: F32.schema, // 0 = perspective, 1 = orthographic, fractional = hybrid
    },
    required: ["aspect", "fieldOfView", "nearPlane", "farPlane", "position", "target", "up", "orthographic"],
    additionalProperties: false,
} as const satisfies Schema;