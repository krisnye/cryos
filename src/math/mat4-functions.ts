import { Mat4x4, Vec3, F32 } from "../types/data-types.js";
import { normalize, cross, sub, dot } from "./vec3-functions.js";

/**
 * Matrix multiplication (a * b).
 * Note: Matrix multiplication is not commutative, a * b ≠ b * a
 */
export const mul = (a: Mat4x4, b: Mat4x4): Mat4x4 => [
    a[0] * b[0] + a[4] * b[1] + a[8] * b[2] + a[12] * b[3],
    a[1] * b[0] + a[5] * b[1] + a[9] * b[2] + a[13] * b[3],
    a[2] * b[0] + a[6] * b[1] + a[10] * b[2] + a[14] * b[3],
    a[3] * b[0] + a[7] * b[1] + a[11] * b[2] + a[15] * b[3],

    a[0] * b[4] + a[4] * b[5] + a[8] * b[6] + a[12] * b[7],
    a[1] * b[4] + a[5] * b[5] + a[9] * b[6] + a[13] * b[7],
    a[2] * b[4] + a[6] * b[5] + a[10] * b[6] + a[14] * b[7],
    a[3] * b[4] + a[7] * b[5] + a[11] * b[6] + a[15] * b[7],

    a[0] * b[8] + a[4] * b[9] + a[8] * b[10] + a[12] * b[11],
    a[1] * b[8] + a[5] * b[9] + a[9] * b[10] + a[13] * b[11],
    a[2] * b[8] + a[6] * b[9] + a[10] * b[10] + a[14] * b[11],
    a[3] * b[8] + a[7] * b[9] + a[11] * b[10] + a[15] * b[11],

    a[0] * b[12] + a[4] * b[13] + a[8] * b[14] + a[12] * b[15],
    a[1] * b[12] + a[5] * b[13] + a[9] * b[14] + a[13] * b[15],
    a[2] * b[12] + a[6] * b[13] + a[10] * b[14] + a[14] * b[15],
    a[3] * b[12] + a[7] * b[13] + a[11] * b[14] + a[15] * b[15]
];

/**
 * Computes the inverse of a 4x4 matrix.
 * Throws if the matrix is not invertible (determinant = 0).
 * 
 * Note: For rigid body transforms (rotation + translation only),
 * it's more efficient to compute the inverse using transpose and negation.
 */
export const inverse = (m: Mat4x4): Mat4x4 => {
    const b00 = m[0] * m[5] - m[1] * m[4];
    const b01 = m[0] * m[6] - m[2] * m[4];
    const b02 = m[0] * m[7] - m[3] * m[4];
    const b03 = m[1] * m[6] - m[2] * m[5];
    const b04 = m[1] * m[7] - m[3] * m[5];
    const b05 = m[2] * m[7] - m[3] * m[6];
    const b06 = m[8] * m[13] - m[9] * m[12];
    const b07 = m[8] * m[14] - m[10] * m[12];
    const b08 = m[8] * m[15] - m[11] * m[12];
    const b09 = m[9] * m[14] - m[10] * m[13];
    const b10 = m[9] * m[15] - m[11] * m[13];
    const b11 = m[10] * m[15] - m[11] * m[14];

    const det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
    if (det === 0) {
        throw new Error("Cannot invert matrix");
    }
    const invDet = 1 / det;

    return [
        (m[5] * b11 - m[6] * b10 + m[7] * b09) * invDet,
        (m[2] * b10 - m[1] * b11 - m[3] * b09) * invDet,
        (m[13] * b05 - m[14] * b04 + m[15] * b03) * invDet,
        (m[10] * b04 - m[9] * b05 - m[11] * b03) * invDet,
        (m[6] * b08 - m[4] * b11 - m[7] * b07) * invDet,
        (m[0] * b11 - m[2] * b08 + m[3] * b07) * invDet,
        (m[14] * b02 - m[12] * b05 - m[15] * b01) * invDet,
        (m[8] * b05 - m[10] * b02 + m[11] * b01) * invDet,
        (m[4] * b10 - m[5] * b08 + m[7] * b06) * invDet,
        (m[1] * b08 - m[0] * b10 - m[3] * b06) * invDet,
        (m[12] * b04 - m[13] * b02 + m[15] * b00) * invDet,
        (m[9] * b02 - m[8] * b04 - m[11] * b00) * invDet,
        (m[5] * b07 - m[4] * b09 - m[6] * b06) * invDet,
        (m[0] * b09 - m[1] * b07 + m[2] * b06) * invDet,
        (m[13] * b01 - m[12] * b03 - m[14] * b00) * invDet,
        (m[8] * b03 - m[9] * b01 + m[10] * b00) * invDet
    ];
};

export const transpose = (m: Mat4x4): Mat4x4 => [
    m[0], m[4], m[8], m[12],
    m[1], m[5], m[9], m[13],
    m[2], m[6], m[10], m[14],
    m[3], m[7], m[11], m[15]
];

export const identity: Mat4x4 = [
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1
];

/**
 * Creates a rotation matrix that rotates around an arbitrary axis.
 * @param axis The axis to rotate around (will be normalized)
 * @param angle The angle to rotate in radians
 * @throws If the axis length is too close to zero
 */
export const rotation = (axis: Vec3, angle: F32): Mat4x4 => {
    const len = Math.hypot(axis[0], axis[1], axis[2]);
    if (len < 1e-6) {
        throw new Error("Invalid rotation axis");
    }

    const x = axis[0] / len;
    const y = axis[1] / len;
    const z = axis[2] / len;
    const s = Math.sin(angle);
    const c = Math.cos(angle);
    const t = 1 - c;

    return [
        x * x * t + c,     y * x * t + z * s, z * x * t - y * s, 0,
        x * y * t - z * s, y * y * t + c,     z * y * t + x * s, 0,
        x * z * t + y * s, y * z * t - x * s, z * z * t + c,     0,
        0,                 0,                 0,                 1
    ];
};

export const scaling = (x: F32, y: F32 = x, z: F32 = y): Mat4x4 => [
    x, 0, 0, 0,
    0, y, 0, 0,
    0, 0, z, 0,
    0, 0, 0, 1
];

export const translation = (x: F32, y: F32, z: F32): Mat4x4 => [
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    x, y, z, 1
];

/**
 * Creates a perspective projection matrix.
 * @param fov Vertical field of view in radians
 * @param aspect Aspect ratio (width / height)
 * @param near Distance to near clipping plane (must be positive)
 * @param far Distance to far clipping plane (must be greater than near)
 */
export const perspective = (fov: F32, aspect: F32, near: F32, far: F32): Mat4x4 => {
    const f = 1 / Math.tan(fov / 2);
    const rangeInv = 1 / (near - far);
    return [
        f / aspect, 0, 0, 0,
        0, f, 0, 0,
        0, 0, (near + far) * rangeInv, -1,
        0, 0, near * far * rangeInv * 2, 0
    ];
};

/**
 * Creates an orthographic projection matrix.
 * Maps the box defined by left/right/bottom/top/near/far to the unit cube [-1,1]³
 */
export const orthographic = (left: F32, right: F32, bottom: F32, top: F32, near: F32, far: F32): Mat4x4 => {
    const lr = 1 / (left - right);
    const bt = 1 / (bottom - top);
    const nf = 1 / (near - far);
    return [
        -2 * lr, 0, 0, 0,
        0, -2 * bt, 0, 0,
        0, 0, 2 * nf, 0,
        (left + right) * lr, (top + bottom) * bt, (far + near) * nf, 1
    ];
};

/**
 * Creates a view matrix that looks from 'eye' towards 'center' with 'up' orientation.
 * This is equivalent to the inverse of a camera transform matrix.
 * @param eye Position of the camera
 * @param center Point to look at
 * @param up Up vector (will be normalized)
 */
export const lookAt = (eye: Vec3, center: Vec3, up: Vec3): Mat4x4 => {
    const f = normalize(sub(center, eye));
    const s = normalize(cross(f, up));
    const u = cross(s, f);

    return [
        s[0], u[0], -f[0], 0,
        s[1], u[1], -f[1], 0,
        s[2], u[2], -f[2], 0,
        -dot(s, eye), -dot(u, eye), dot(f, eye), 1
    ];
};

/**
 * Compares two matrices for approximate equality.
 * Useful when dealing with floating point math where exact equality is rare.
 */
export const equivalent = (a: Mat4x4, b: Mat4x4, epsilon = 1e-6): boolean => {
    for (let i = 0; i < 16; i++) {
        if (Math.abs(a[i] - b[i]) > epsilon) {
            return false;
        }
    }
    return true;
};

/**
 * Creates a scaling matrix with optional per-axis scale factors.
 * @param sx Scale factor for x axis
 * @param sy Scale factor for y axis (defaults to sx)
 * @param sz Scale factor for z axis (defaults to sy)
 */
export const createScalingMat4 = (sx: F32, sy: F32 = sx, sz: F32 = sy): Mat4x4 => [
    sx, 0, 0, 0,
    0, sy, 0, 0,
    0, 0, sz, 0,
    0, 0, 0, 1
];

/**
 * Creates a translation matrix optimized for performance.
 * @param tx Translation along x axis
 * @param ty Translation along y axis
 * @param tz Translation along z axis
 */
export const createTranslationMat4 = (tx: F32, ty: F32, tz: F32): Mat4x4 => [
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    tx, ty, tz, 1
];

/**
 * Creates a rotation matrix around the X axis.
 * More efficient than general rotation for X-axis rotations.
 * @param angle Rotation angle in radians
 */
export const createRotationXMat4 = (angle: F32): Mat4x4 => {
    const s = Math.sin(angle);
    const c = Math.cos(angle);
    return [
        1, 0, 0, 0,
        0, c, s, 0,
        0, -s, c, 0,
        0, 0, 0, 1
    ];
};

/**
 * Creates a rotation matrix around the Y axis.
 * More efficient than general rotation for Y-axis rotations.
 * @param angle Rotation angle in radians
 */
export const createRotationYMat4 = (angle: F32): Mat4x4 => {
    const s = Math.sin(angle);
    const c = Math.cos(angle);
    return [
        c, 0, -s, 0,
        0, 1, 0, 0,
        s, 0, c, 0,
        0, 0, 0, 1
    ];
};

/**
 * Creates a rotation matrix around the Z axis.
 * More efficient than general rotation for Z-axis rotations.
 * @param angle Rotation angle in radians
 */
export const createRotationZMat4 = (angle: F32): Mat4x4 => {
    const s = Math.sin(angle);
    const c = Math.cos(angle);
    return [
        c, s, 0, 0,
        -s, c, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1
    ];
};

/**
 * Creates a perspective matrix with infinite far plane.
 * More efficient than regular perspective and better for depth precision.
 * @param fov Vertical field of view in radians
 * @param aspect Aspect ratio (width / height)
 * @param near Distance to near clipping plane (must be positive)
 */
export const createPerspectiveInfiniteMat4 = ({
    fov,
    aspect,
    near
}: {
    /** Vertical field of view in radians */
    fov: F32,
    /** Aspect ratio (width / height) */
    aspect: F32,
    /** Distance to near clipping plane (must be positive) */
    near: F32
}): Mat4x4 => {
    const f = 1 / Math.tan(fov / 2);
    return [
        f / aspect, 0, 0, 0,
        0, f, 0, 0,
        0, 0, -1, -1,
        0, 0, -near, 0
    ];
};

/**
 * Creates a perspective matrix optimized for performance.
 * @param fov Vertical field of view in radians
 * @param aspect Aspect ratio (width / height)
 * @param near Distance to near clipping plane (must be positive)
 * @param far Distance to far clipping plane (must be greater than near)
 */
export const createPerspectiveMat4 = ({
    fov,
    aspect,
    near,
    far
}: {
    /** Vertical field of view in radians */
    fov: F32,
    /** Aspect ratio (width / height) */
    aspect: F32,
    /** Distance to near clipping plane (must be positive) */
    near: F32,
    /** Distance to far clipping plane (must be greater than near) */
    far: F32
}): Mat4x4 => {
    const f = 1 / Math.tan(fov / 2);
    const rangeInv = 1 / (near - far);
    return [
        f / aspect, 0, 0, 0,
        0, f, 0, 0,
        0, 0, (near + far) * rangeInv, -1,
        0, 0, near * far * rangeInv * 2, 0
    ];
};

/**
 * Creates an orthographic matrix optimized for performance.
 * @param width Width of the view volume
 * @param height Height of the view volume
 * @param near Near clipping plane
 * @param far Far clipping plane
 */
export const createOrthographicMat4 = ({
    left,
    right,
    bottom,
    top,
    near,
    far
}: {
    /** Left edge of view volume */
    left: F32,
    /** Right edge of view volume */
    right: F32,
    /** Bottom edge of view volume */
    bottom: F32,
    /** Top edge of view volume */
    top: F32,
    /** Near clipping plane */
    near: F32,
    /** Far clipping plane */
    far: F32
}): Mat4x4 => {
    const lr = 1 / (left - right);
    const bt = 1 / (bottom - top);
    const nf = 1 / (near - far);
    return [
        -2 * lr, 0, 0, 0,
        0, -2 * bt, 0, 0,
        0, 0, 2 * nf, 0,
        (left + right) * lr, (top + bottom) * bt, (far + near) * nf, 1
    ];
};

/**
 * Creates a view matrix for 2D rendering.
 * Optimized for 2D camera transformations.
 * @param x Camera x position
 * @param y Camera y position
 * @param scale Camera zoom factor
 */
export const createView2DMat4 = (x: F32, y: F32, scale: F32): Mat4x4 => [
    scale, 0, 0, 0,
    0, scale, 0, 0,
    0, 0, 1, 0,
    -x * scale, -y * scale, 0, 1
];

/**
 * Creates a view matrix that looks from 'eye' towards 'center' with 'up' orientation.
 * This is equivalent to the inverse of a camera transform matrix.
 */
export const createLookAtMat4 = ({
    eye,
    center,
    up
}: {
    /** Position of the camera */
    eye: Vec3,
    /** Point to look at */
    center: Vec3,
    /** Up vector (will be normalized) */
    up: Vec3
}): Mat4x4 => {
    const f = normalize(sub(center, eye));
    const s = normalize(cross(f, up));
    const u = cross(s, f);

    return [
        s[0], u[0], -f[0], 0,
        s[1], u[1], -f[1], 0,
        s[2], u[2], -f[2], 0,
        -dot(s, eye), -dot(u, eye), dot(f, eye), 1
    ];
}; 