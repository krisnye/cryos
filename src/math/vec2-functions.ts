import { Vec2, F32 } from "../types/data-types.js";

export const add = (a: Vec2, b: Vec2): Vec2 => [
    a[0] + b[0],
    a[1] + b[1]
];

export const sub = (a: Vec2, b: Vec2): Vec2 => [
    a[0] - b[0],
    a[1] - b[1]
];

export const mul = (a: Vec2, b: Vec2): Vec2 => [
    a[0] * b[0],
    a[1] * b[1]
];

export const div = (a: Vec2, b: Vec2): Vec2 => [
    a[0] / b[0],
    a[1] / b[1]
];

export const scale = (v: Vec2, factor: F32): Vec2 => [
    v[0] * factor,
    v[1] * factor
];

export const neg = (v: Vec2): Vec2 => [
    -v[0],
    -v[1]
];

export const dot = (a: Vec2, b: Vec2): F32 =>
    a[0] * b[0] + a[1] * b[1];

export const length = (v: Vec2): F32 =>
    Math.hypot(v[0], v[1]);

export const lengthSquared = (v: Vec2): F32 =>
    v[0] * v[0] + v[1] * v[1];

export const distance = (a: Vec2, b: Vec2): F32 =>
    length(sub(b, a));

export const distanceSquared = (a: Vec2, b: Vec2): F32 =>
    lengthSquared(sub(b, a));

export const normalize = (v: Vec2): Vec2 => {
    const invLength = 1 / length(v);
    return scale(v, invLength);
};

export const mix = (a: Vec2, b: Vec2, t: F32): Vec2 => [
    a[0] + t * (b[0] - a[0]),
    a[1] + t * (b[1] - a[1])
];

export const min = (a: Vec2, b: Vec2): Vec2 => [
    Math.min(a[0], b[0]),
    Math.min(a[1], b[1])
];

export const max = (a: Vec2, b: Vec2): Vec2 => [
    Math.max(a[0], b[0]),
    Math.max(a[1], b[1])
];

export const clamp = (v: Vec2, min: Vec2, max: Vec2): Vec2 => [
    Math.min(Math.max(v[0], min[0]), max[0]),
    Math.min(Math.max(v[1], min[1]), max[1])
];

export const abs = (v: Vec2): Vec2 => [
    Math.abs(v[0]),
    Math.abs(v[1])
];

export const floor = (v: Vec2): Vec2 => [
    Math.floor(v[0]),
    Math.floor(v[1])
];

export const ceil = (v: Vec2): Vec2 => [
    Math.ceil(v[0]),
    Math.ceil(v[1])
];

export const round = (v: Vec2): Vec2 => [
    Math.round(v[0]),
    Math.round(v[1])
];

export const zero: Vec2 = [0, 0];
export const one: Vec2 = [1, 1];

export const equivalent = (a: Vec2, b: Vec2, epsilon = 1e-6): boolean =>
    Math.abs(a[0] - b[0]) <= epsilon &&
    Math.abs(a[1] - b[1]) <= epsilon; 