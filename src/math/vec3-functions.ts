import { Vec3, F32 } from "../types/data-types.js";

export const add = (a: Vec3, b: Vec3): Vec3 => [
    a[0] + b[0],
    a[1] + b[1],
    a[2] + b[2]
];

export const sub = (a: Vec3, b: Vec3): Vec3 => [
    a[0] - b[0],
    a[1] - b[1],
    a[2] - b[2]
];

export const mul = (a: Vec3, b: Vec3): Vec3 => [
    a[0] * b[0],
    a[1] * b[1],
    a[2] * b[2]
];

export const div = (a: Vec3, b: Vec3): Vec3 => [
    a[0] / b[0],
    a[1] / b[1],
    a[2] / b[2]
];

export const scale = (v: Vec3, factor: F32): Vec3 => [
    v[0] * factor,
    v[1] * factor,
    v[2] * factor
];

export const neg = (v: Vec3): Vec3 => [
    -v[0],
    -v[1],
    -v[2]
];

export const dot = (a: Vec3, b: Vec3): F32 =>
    a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

export const cross = (a: Vec3, b: Vec3): Vec3 => [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0]
];

export const length = (v: Vec3): F32 =>
    Math.hypot(v[0], v[1], v[2]);

export const lengthSquared = (v: Vec3): F32 =>
    v[0] * v[0] + v[1] * v[1] + v[2] * v[2];

export const distance = (a: Vec3, b: Vec3): F32 =>
    length(sub(b, a));

export const distanceSquared = (a: Vec3, b: Vec3): F32 =>
    lengthSquared(sub(b, a));

export const normalize = (v: Vec3): Vec3 => {
    const invLength = 1 / length(v);
    return scale(v, invLength);
};

export const mix = (a: Vec3, b: Vec3, t: F32): Vec3 => [
    a[0] + t * (b[0] - a[0]),
    a[1] + t * (b[1] - a[1]),
    a[2] + t * (b[2] - a[2])
];

export const min = (a: Vec3, b: Vec3): Vec3 => [
    Math.min(a[0], b[0]),
    Math.min(a[1], b[1]),
    Math.min(a[2], b[2])
];

export const max = (a: Vec3, b: Vec3): Vec3 => [
    Math.max(a[0], b[0]),
    Math.max(a[1], b[1]),
    Math.max(a[2], b[2])
];

export const clamp = (v: Vec3, min: Vec3, max: Vec3): Vec3 => [
    Math.min(Math.max(v[0], min[0]), max[0]),
    Math.min(Math.max(v[1], min[1]), max[1]),
    Math.min(Math.max(v[2], min[2]), max[2])
];

export const abs = (v: Vec3): Vec3 => [
    Math.abs(v[0]),
    Math.abs(v[1]),
    Math.abs(v[2])
];

export const floor = (v: Vec3): Vec3 => [
    Math.floor(v[0]),
    Math.floor(v[1]),
    Math.floor(v[2])
];

export const ceil = (v: Vec3): Vec3 => [
    Math.ceil(v[0]),
    Math.ceil(v[1]),
    Math.ceil(v[2])
];

export const round = (v: Vec3): Vec3 => [
    Math.round(v[0]),
    Math.round(v[1]),
    Math.round(v[2])
];

export const zero: Vec3 = [0, 0, 0];
export const one: Vec3 = [1, 1, 1];

export const equivalent = (a: Vec3, b: Vec3, epsilon = 1e-6): boolean =>
    Math.abs(a[0] - b[0]) <= epsilon &&
    Math.abs(a[1] - b[1]) <= epsilon &&
    Math.abs(a[2] - b[2]) <= epsilon; 