import { FromSchema, Schema } from "@adobe/data/schema";
import { Mat4x4, Quat, Vec3 } from "@adobe/data/math";

export type Transform = FromSchema<typeof Transform.schema>;

export namespace Transform {
    export const schema = {
        type: "object",
        properties: {
            position: Vec3.schema,
            rotation: Quat.schema,
            scale: Vec3.schema,
        },
        required: ["position", "rotation", "scale"],
        additionalProperties: false,
        layout: "std140",
    } as const satisfies Schema;

    export const identity: Transform = {
        position: Vec3.zero,
        rotation: Quat.identity,
        scale: Vec3.one,
    };

    export const toMatrix = (transform: Transform): Mat4x4 => {
        const { position, rotation, scale } = transform;
        
        // Create rotation matrix from quaternion
        const rotationMatrix = Quat.toMat4(rotation);
        
        // Create scale matrix
        const scaleMatrix = Mat4x4.scaling(scale[0], scale[1], scale[2]);
        
        // Create translation matrix
        const translationMatrix = Mat4x4.translation(position[0], position[1], position[2]);
        
        // Combine in TRS order: Translation * Rotation * Scale
        const rs = Mat4x4.multiply(rotationMatrix, scaleMatrix);
        return Mat4x4.multiply(translationMatrix, rs);
    };

    export const transform = (transform: Transform, point: Vec3): Vec3 => {
        const { position, rotation, scale } = transform;
        
        // Apply scale
        const sx = point[0] * scale[0];
        const sy = point[1] * scale[1];
        const sz = point[2] * scale[2];
        
        // Apply rotation (quaternion rotation unrolled)
        const [qx, qy, qz, qw] = rotation;
        
        // Compute qv × scaled (cross product)
        const uvx = qy * sz - qz * sy;
        const uvy = qz * sx - qx * sz;
        const uvz = qx * sy - qy * sx;
        
        // Compute qv × uv (cross product)
        const uuvx = qy * uvz - qz * uvy;
        const uuvy = qz * uvx - qx * uvz;
        const uuvz = qx * uvy - qy * uvx;
        
        // Combine: scaled + 2*w*uv + 2*uuv
        const scaleFactor = 2 * qw;
        const rx = sx + scaleFactor * uvx + 2 * uuvx;
        const ry = sy + scaleFactor * uvy + 2 * uuvy;
        const rz = sz + scaleFactor * uvz + 2 * uuvz;
        
        // Apply translation
        return [
            rx + position[0],
            ry + position[1],
            rz + position[2]
        ];
    };

    /**
     * Applies the inverse transformation to a point.
     * This is the reverse operation of transform(): if transform(t, p) = p',
     * then transformInverse(t, p') = p.
     * 
     * Note: Assumes rotation is a unit quaternion (which is guaranteed by Quat.fromAxisAngle).
     */
    export const transformInverse = (transform: Transform, point: Vec3): Vec3 => {
        const { position, rotation, scale } = transform;
        
        // Remove translation
        const tx = point[0] - position[0];
        const ty = point[1] - position[1];
        const tz = point[2] - position[2];
        
        // Apply inverse rotation using quaternion conjugate (for unit quaternions: q^-1 = conjugate(q))
        const [qx, qy, qz, qw] = rotation;
        const iqx = -qx;
        const iqy = -qy;
        const iqz = -qz;
        
        // Compute qv × translated (cross product)
        const uvx = iqy * tz - iqz * ty;
        const uvy = iqz * tx - iqx * tz;
        const uvz = iqx * ty - iqy * tx;
        
        // Compute qv × uv (cross product)
        const uuvx = iqy * uvz - iqz * uvy;
        const uuvy = iqz * uvx - iqx * uvz;
        const uuvz = iqx * uvy - iqy * uvx;
        
        // Combine: translated + 2*w*uv + 2*uuv
        const scaleFactor = 2 * qw;
        const rx = tx + scaleFactor * uvx + 2 * uuvx;
        const ry = ty + scaleFactor * uvy + 2 * uuvy;
        const rz = tz + scaleFactor * uvz + 2 * uuvz;
        
        // Apply inverse scale (division)
        return [
            rx / scale[0],
            ry / scale[1],
            rz / scale[2]
        ];
    };

}