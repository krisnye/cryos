import { F32Schema, FromSchema, Schema } from "@adobe/data/schema";
import { Vec3 } from "@adobe/data/math";

// discussion of new unified orthographic/perspective camera
// https://chatgpt.com/share/68d02b24-0ab4-8009-9551-ae1736b95945

export const CameraSchema = {
    type: 'object',
    properties: {
        aspect: F32Schema,
        fieldOfView: F32Schema,
        nearPlane: F32Schema,
        farPlane: F32Schema,
        position: Vec3.schema,
        // when interpolating between perspective and orthographic, the target indicates the focal plane
        // that we fix as the frustrum closer expands and the frustrum further contracts
        target: Vec3.schema,
        up: Vec3.schema,
        orthographic: F32Schema, // 0 = perspective, 1 = orthographic, fractional = hybrid
    },
    required: ["aspect", "fieldOfView", "nearPlane", "farPlane", "position", "target", "up", "orthographic"],
    additionalProperties: false,
} as const satisfies Schema;

export type Camera = FromSchema<typeof CameraSchema>;
