import type { Vec3 } from './Vec3.js';

// Mathematical Operations
export const Vec3_abs = ([x, y, z]: Vec3): Vec3 => [Math.abs(x), Math.abs(y), Math.abs(z)];
export const Vec3_ceil = ([x, y, z]: Vec3): Vec3 => [Math.ceil(x), Math.ceil(y), Math.ceil(z)];
export const Vec3_floor = ([x, y, z]: Vec3): Vec3 => [Math.floor(x), Math.floor(y), Math.floor(z)];
export const Vec3_round = ([x, y, z]: Vec3): Vec3 => [Math.round(x), Math.round(y), Math.round(z)];
export const Vec3_trunc = ([x, y, z]: Vec3): Vec3 => [Math.trunc(x), Math.trunc(y), Math.trunc(z)];
export const Vec3_min = ([x1, y1, z1]: Vec3, [x2, y2, z2]: Vec3): Vec3 => [
    Math.min(x1, x2),
    Math.min(y1, y2),
    Math.min(z1, z2)
];
export const Vec3_max = ([x1, y1, z1]: Vec3, [x2, y2, z2]: Vec3): Vec3 => [
    Math.max(x1, x2),
    Math.max(y1, y2),
    Math.max(z1, z2)
];
export const Vec3_clamp = (v: Vec3, min: Vec3, max: Vec3): Vec3 => Vec3_min(Vec3_max(v, min), max);
export const Vec3_mix = ([x1, y1, z1]: Vec3, [x2, y2, z2]: Vec3, t: number): Vec3 => [
    x1 * (1 - t) + x2 * t,
    y1 * (1 - t) + y2 * t,
    z1 * (1 - t) + z2 * t
];
export const Vec3_step = ([edge1, edge2, edge3]: Vec3, [x, y, z]: Vec3): Vec3 => [
    x < edge1 ? 0 : 1,
    y < edge2 ? 0 : 1,
    z < edge3 ? 0 : 1
];
export const Vec3_smoothstep = ([e0x, e0y, e0z]: Vec3, [e1x, e1y, e1z]: Vec3, [x, y, z]: Vec3): Vec3 => {
    const tx = Math.max(0, Math.min(1, (x - e0x) / (e1x - e0x)));
    const ty = Math.max(0, Math.min(1, (y - e0y) / (e1y - e0y)));
    const tz = Math.max(0, Math.min(1, (z - e0z) / (e1z - e0z)));
    return [
        tx * tx * (3 - 2 * tx),
        ty * ty * (3 - 2 * ty),
        tz * tz * (3 - 2 * tz)
    ];
};

// Geometric Functions
export const Vec3_length = ([x, y, z]: Vec3): number => Math.sqrt(x * x + y * y + z * z);
export const Vec3_distance = (a: Vec3, b: Vec3): number => Vec3_length(Vec3_subtract(b, a));
export const Vec3_dot = ([x1, y1, z1]: Vec3, [x2, y2, z2]: Vec3): number => 
    x1 * x2 + y1 * y2 + z1 * z2;
export const Vec3_cross = ([x1, y1, z1]: Vec3, [x2, y2, z2]: Vec3): Vec3 => [
    y1 * z2 - z1 * y2,
    z1 * x2 - x1 * z2,
    x1 * y2 - y1 * x2
];
export const Vec3_normalize = (v: Vec3): Vec3 => {
    const len = Vec3_length(v);
    return len === 0 ? [0, 0, 0] : Vec3_scale(v, 1 / len);
};
export const Vec3_faceforward = (n: Vec3, i: Vec3, nref: Vec3): Vec3 => 
    Vec3_dot(nref, i) < 0 ? n : Vec3_negate(n);
export const Vec3_reflect = (i: Vec3, n: Vec3): Vec3 => {
    const dot2 = Vec3_dot(n, i) * 2;
    return Vec3_subtract(i, Vec3_scale(n, dot2));
};
export const Vec3_refract = (i: Vec3, n: Vec3, eta: number): Vec3 => {
    const dot = Vec3_dot(n, i);
    const k = 1.0 - eta * eta * (1.0 - dot * dot);
    if (k < 0.0) {
        return [0, 0, 0];
    }
    const scale = eta * dot + Math.sqrt(k);
    return Vec3_subtract(Vec3_scale(i, eta), Vec3_scale(n, scale));
};

// Trigonometric Functions
export const Vec3_sin = ([x, y, z]: Vec3): Vec3 => [Math.sin(x), Math.sin(y), Math.sin(z)];
export const Vec3_cos = ([x, y, z]: Vec3): Vec3 => [Math.cos(x), Math.cos(y), Math.cos(z)];
export const Vec3_tan = ([x, y, z]: Vec3): Vec3 => [Math.tan(x), Math.tan(y), Math.tan(z)];
export const Vec3_asin = ([x, y, z]: Vec3): Vec3 => [Math.asin(x), Math.asin(y), Math.asin(z)];
export const Vec3_acos = ([x, y, z]: Vec3): Vec3 => [Math.acos(x), Math.acos(y), Math.acos(z)];
export const Vec3_atan = ([x, y, z]: Vec3): Vec3 => [Math.atan(x), Math.atan(y), Math.atan(z)];
export const Vec3_sinh = ([x, y, z]: Vec3): Vec3 => [Math.sinh(x), Math.sinh(y), Math.sinh(z)];
export const Vec3_cosh = ([x, y, z]: Vec3): Vec3 => [Math.cosh(x), Math.cosh(y), Math.cosh(z)];
export const Vec3_tanh = ([x, y, z]: Vec3): Vec3 => [Math.tanh(x), Math.tanh(y), Math.tanh(z)];
export const Vec3_asinh = ([x, y, z]: Vec3): Vec3 => [Math.asinh(x), Math.asinh(y), Math.asinh(z)];
export const Vec3_acosh = ([x, y, z]: Vec3): Vec3 => [Math.acosh(x), Math.acosh(y), Math.acosh(z)];
export const Vec3_atanh = ([x, y, z]: Vec3): Vec3 => [Math.atanh(x), Math.atanh(y), Math.atanh(z)];

// Common Functions
export const Vec3_sign = ([x, y, z]: Vec3): Vec3 => [Math.sign(x), Math.sign(y), Math.sign(z)];
export const Vec3_fract = ([x, y, z]: Vec3): Vec3 => [
    x - Math.floor(x),
    y - Math.floor(y),
    z - Math.floor(z)
];
export const Vec3_mod = ([x, y, z]: Vec3, m: number): Vec3 => [
    ((x % m) + m) % m,
    ((y % m) + m) % m,
    ((z % m) + m) % m
];
export const Vec3_modf = ([x, y, z]: Vec3): { fract: Vec3; whole: Vec3 } => ({
    whole: [Math.trunc(x), Math.trunc(y), Math.trunc(z)],
    fract: [x - Math.trunc(x), y - Math.trunc(y), z - Math.trunc(z)]
});
export const Vec3_pow = ([x1, y1, z1]: Vec3, [x2, y2, z2]: Vec3): Vec3 => [
    Math.pow(x1, x2),
    Math.pow(y1, y2),
    Math.pow(z1, z2)
];
export const Vec3_exp = ([x, y, z]: Vec3): Vec3 => [Math.exp(x), Math.exp(y), Math.exp(z)];
export const Vec3_exp2 = ([x, y, z]: Vec3): Vec3 => [Math.pow(2, x), Math.pow(2, y), Math.pow(2, z)];
export const Vec3_log = ([x, y, z]: Vec3): Vec3 => [Math.log(x), Math.log(y), Math.log(z)];
export const Vec3_log2 = ([x, y, z]: Vec3): Vec3 => [Math.log2(x), Math.log2(y), Math.log2(z)];
export const Vec3_sqrt = ([x, y, z]: Vec3): Vec3 => [Math.sqrt(x), Math.sqrt(y), Math.sqrt(z)];

// Helper functions needed by some of the above
export const Vec3_subtract = ([x1, y1, z1]: Vec3, [x2, y2, z2]: Vec3): Vec3 => [
    x1 - x2,
    y1 - y2,
    z1 - z2
];
export const Vec3_scale = ([x, y, z]: Vec3, s: number): Vec3 => [x * s, y * s, z * s];
export const Vec3_negate = ([x, y, z]: Vec3): Vec3 => [-x, -y, -z]; 