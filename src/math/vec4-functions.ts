import { Vec4, F32 } from "../types/data-types.js";

export const add = (a: Vec4, b: Vec4): Vec4 => [
    a[0] + b[0],
    a[1] + b[1],
    a[2] + b[2],
    a[3] + b[3]
];

export const sub = (a: Vec4, b: Vec4): Vec4 => [
    a[0] - b[0],
    a[1] - b[1],
    a[2] - b[2],
    a[3] - b[3]
];

export const mul = (a: Vec4, b: Vec4): Vec4 => [
    a[0] * b[0],
    a[1] * b[1],
    a[2] * b[2],
    a[3] * b[3]
];

export const div = (a: Vec4, b: Vec4): Vec4 => [
    a[0] / b[0],
    a[1] / b[1],
    a[2] / b[2],
    a[3] / b[3]
];

export const scale = (v: Vec4, factor: F32): Vec4 => [
    v[0] * factor,
    v[1] * factor,
    v[2] * factor,
    v[3] * factor
];

export const neg = (v: Vec4): Vec4 => [
    -v[0],
    -v[1],
    -v[2],
    -v[3]
];

export const dot = (a: Vec4, b: Vec4): F32 =>
    a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3];

export const length = (v: Vec4): F32 =>
    Math.hypot(v[0], v[1], v[2], v[3]);

export const lengthSquared = (v: Vec4): F32 =>
    v[0] * v[0] + v[1] * v[1] + v[2] * v[2] + v[3] * v[3];

export const distance = (a: Vec4, b: Vec4): F32 =>
    length(sub(b, a));

export const distanceSquared = (a: Vec4, b: Vec4): F32 =>
    lengthSquared(sub(b, a));

export const normalize = (v: Vec4): Vec4 => {
    const invLength = 1 / length(v);
    return scale(v, invLength);
};

export const mix = (a: Vec4, b: Vec4, t: F32): Vec4 => [
    a[0] + t * (b[0] - a[0]),
    a[1] + t * (b[1] - a[1]),
    a[2] + t * (b[2] - a[2]),
    a[3] + t * (b[3] - a[3])
];

export const min = (a: Vec4, b: Vec4): Vec4 => [
    Math.min(a[0], b[0]),
    Math.min(a[1], b[1]),
    Math.min(a[2], b[2]),
    Math.min(a[3], b[3])
];

export const max = (a: Vec4, b: Vec4): Vec4 => [
    Math.max(a[0], b[0]),
    Math.max(a[1], b[1]),
    Math.max(a[2], b[2]),
    Math.max(a[3], b[3])
];

export const clamp = (v: Vec4, min: Vec4, max: Vec4): Vec4 => [
    Math.min(Math.max(v[0], min[0]), max[0]),
    Math.min(Math.max(v[1], min[1]), max[1]),
    Math.min(Math.max(v[2], min[2]), max[2]),
    Math.min(Math.max(v[3], min[3]), max[3])
];

export const abs = (v: Vec4): Vec4 => [
    Math.abs(v[0]),
    Math.abs(v[1]),
    Math.abs(v[2]),
    Math.abs(v[3])
];

export const floor = (v: Vec4): Vec4 => [
    Math.floor(v[0]),
    Math.floor(v[1]),
    Math.floor(v[2]),
    Math.floor(v[3])
];

export const ceil = (v: Vec4): Vec4 => [
    Math.ceil(v[0]),
    Math.ceil(v[1]),
    Math.ceil(v[2]),
    Math.ceil(v[3])
];

export const round = (v: Vec4): Vec4 => [
    Math.round(v[0]),
    Math.round(v[1]),
    Math.round(v[2]),
    Math.round(v[3])
];

export const zero: Vec4 = [0, 0, 0, 0];
export const one: Vec4 = [1, 1, 1, 1];

export const equivalent = (a: Vec4, b: Vec4, epsilon = 1e-6): boolean =>
    Math.abs(a[0] - b[0]) <= epsilon &&
    Math.abs(a[1] - b[1]) <= epsilon &&
    Math.abs(a[2] - b[2]) <= epsilon &&
    Math.abs(a[3] - b[3]) <= epsilon; 