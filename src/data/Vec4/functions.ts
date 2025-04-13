import type { Vec4 } from './Vec4.js';

// Mathematical Operations
export const Vec4_abs = ([x, y, z, w]: Vec4): Vec4 => [Math.abs(x), Math.abs(y), Math.abs(z), Math.abs(w)];
export const Vec4_ceil = ([x, y, z, w]: Vec4): Vec4 => [Math.ceil(x), Math.ceil(y), Math.ceil(z), Math.ceil(w)];
export const Vec4_floor = ([x, y, z, w]: Vec4): Vec4 => [Math.floor(x), Math.floor(y), Math.floor(z), Math.floor(w)];
export const Vec4_round = ([x, y, z, w]: Vec4): Vec4 => [Math.round(x), Math.round(y), Math.round(z), Math.round(w)];
export const Vec4_trunc = ([x, y, z, w]: Vec4): Vec4 => [Math.trunc(x), Math.trunc(y), Math.trunc(z), Math.trunc(w)];
export const Vec4_min = ([x1, y1, z1, w1]: Vec4, [x2, y2, z2, w2]: Vec4): Vec4 => [
    Math.min(x1, x2),
    Math.min(y1, y2),
    Math.min(z1, z2),
    Math.min(w1, w2)
];
export const Vec4_max = ([x1, y1, z1, w1]: Vec4, [x2, y2, z2, w2]: Vec4): Vec4 => [
    Math.max(x1, x2),
    Math.max(y1, y2),
    Math.max(z1, z2),
    Math.max(w1, w2)
];
export const Vec4_clamp = (v: Vec4, min: Vec4, max: Vec4): Vec4 => Vec4_min(Vec4_max(v, min), max);
export const Vec4_mix = ([x1, y1, z1, w1]: Vec4, [x2, y2, z2, w2]: Vec4, t: number): Vec4 => [
    x1 * (1 - t) + x2 * t,
    y1 * (1 - t) + y2 * t,
    z1 * (1 - t) + z2 * t,
    w1 * (1 - t) + w2 * t
];
export const Vec4_step = ([edge1, edge2, edge3, edge4]: Vec4, [x, y, z, w]: Vec4): Vec4 => [
    x < edge1 ? 0 : 1,
    y < edge2 ? 0 : 1,
    z < edge3 ? 0 : 1,
    w < edge4 ? 0 : 1
];
export const Vec4_smoothstep = ([e0x, e0y, e0z, e0w]: Vec4, [e1x, e1y, e1z, e1w]: Vec4, [x, y, z, w]: Vec4): Vec4 => {
    const tx = Math.max(0, Math.min(1, (x - e0x) / (e1x - e0x)));
    const ty = Math.max(0, Math.min(1, (y - e0y) / (e1y - e0y)));
    const tz = Math.max(0, Math.min(1, (z - e0z) / (e1z - e0z)));
    const tw = Math.max(0, Math.min(1, (w - e0w) / (e1w - e0w)));
    return [
        tx * tx * (3 - 2 * tx),
        ty * ty * (3 - 2 * ty),
        tz * tz * (3 - 2 * tz),
        tw * tw * (3 - 2 * tw)
    ];
};

// Geometric Functions
export const Vec4_length = ([x, y, z, w]: Vec4): number => Math.sqrt(x * x + y * y + z * z + w * w);
export const Vec4_distance = (a: Vec4, b: Vec4): number => Vec4_length(Vec4_subtract(b, a));
export const Vec4_dot = ([x1, y1, z1, w1]: Vec4, [x2, y2, z2, w2]: Vec4): number => 
    x1 * x2 + y1 * y2 + z1 * z2 + w1 * w2;
export const Vec4_normalize = (v: Vec4): Vec4 => {
    const len = Vec4_length(v);
    return len === 0 ? [0, 0, 0, 0] : Vec4_scale(v, 1 / len);
};
export const Vec4_faceforward = (n: Vec4, i: Vec4, nref: Vec4): Vec4 => 
    Vec4_dot(nref, i) < 0 ? n : Vec4_negate(n);
export const Vec4_reflect = (i: Vec4, n: Vec4): Vec4 => {
    const dot2 = Vec4_dot(n, i) * 2;
    return Vec4_subtract(i, Vec4_scale(n, dot2));
};
export const Vec4_refract = (i: Vec4, n: Vec4, eta: number): Vec4 => {
    const dot = Vec4_dot(n, i);
    const k = 1.0 - eta * eta * (1.0 - dot * dot);
    if (k < 0.0) {
        return [0, 0, 0, 0];
    }
    const scale = eta * dot + Math.sqrt(k);
    return Vec4_subtract(Vec4_scale(i, eta), Vec4_scale(n, scale));
};

// Trigonometric Functions
export const Vec4_sin = ([x, y, z, w]: Vec4): Vec4 => [Math.sin(x), Math.sin(y), Math.sin(z), Math.sin(w)];
export const Vec4_cos = ([x, y, z, w]: Vec4): Vec4 => [Math.cos(x), Math.cos(y), Math.cos(z), Math.cos(w)];
export const Vec4_tan = ([x, y, z, w]: Vec4): Vec4 => [Math.tan(x), Math.tan(y), Math.tan(z), Math.tan(w)];
export const Vec4_asin = ([x, y, z, w]: Vec4): Vec4 => [Math.asin(x), Math.asin(y), Math.asin(z), Math.asin(w)];
export const Vec4_acos = ([x, y, z, w]: Vec4): Vec4 => [Math.acos(x), Math.acos(y), Math.acos(z), Math.acos(w)];
export const Vec4_atan = ([x, y, z, w]: Vec4): Vec4 => [Math.atan(x), Math.atan(y), Math.atan(z), Math.atan(w)];
export const Vec4_sinh = ([x, y, z, w]: Vec4): Vec4 => [Math.sinh(x), Math.sinh(y), Math.sinh(z), Math.sinh(w)];
export const Vec4_cosh = ([x, y, z, w]: Vec4): Vec4 => [Math.cosh(x), Math.cosh(y), Math.cosh(z), Math.cosh(w)];
export const Vec4_tanh = ([x, y, z, w]: Vec4): Vec4 => [Math.tanh(x), Math.tanh(y), Math.tanh(z), Math.tanh(w)];
export const Vec4_asinh = ([x, y, z, w]: Vec4): Vec4 => [Math.asinh(x), Math.asinh(y), Math.asinh(z), Math.asinh(w)];
export const Vec4_acosh = ([x, y, z, w]: Vec4): Vec4 => [Math.acosh(x), Math.acosh(y), Math.acosh(z), Math.acosh(w)];
export const Vec4_atanh = ([x, y, z, w]: Vec4): Vec4 => [Math.atanh(x), Math.atanh(y), Math.atanh(z), Math.atanh(w)];

// Common Functions
export const Vec4_sign = ([x, y, z, w]: Vec4): Vec4 => [Math.sign(x), Math.sign(y), Math.sign(z), Math.sign(w)];
export const Vec4_fract = ([x, y, z, w]: Vec4): Vec4 => [
    x - Math.floor(x),
    y - Math.floor(y),
    z - Math.floor(z),
    w - Math.floor(w)
];
export const Vec4_mod = ([x, y, z, w]: Vec4, m: number): Vec4 => [
    ((x % m) + m) % m,
    ((y % m) + m) % m,
    ((z % m) + m) % m,
    ((w % m) + m) % m
];
export const Vec4_modf = ([x, y, z, w]: Vec4): { fract: Vec4; whole: Vec4 } => ({
    whole: [Math.trunc(x), Math.trunc(y), Math.trunc(z), Math.trunc(w)],
    fract: [x - Math.trunc(x), y - Math.trunc(y), z - Math.trunc(z), w - Math.trunc(w)]
});
export const Vec4_pow = ([x1, y1, z1, w1]: Vec4, [x2, y2, z2, w2]: Vec4): Vec4 => [
    Math.pow(x1, x2),
    Math.pow(y1, y2),
    Math.pow(z1, z2),
    Math.pow(w1, w2)
];
export const Vec4_exp = ([x, y, z, w]: Vec4): Vec4 => [Math.exp(x), Math.exp(y), Math.exp(z), Math.exp(w)];
export const Vec4_exp2 = ([x, y, z, w]: Vec4): Vec4 => [Math.pow(2, x), Math.pow(2, y), Math.pow(2, z), Math.pow(2, w)];
export const Vec4_log = ([x, y, z, w]: Vec4): Vec4 => [Math.log(x), Math.log(y), Math.log(z), Math.log(w)];
export const Vec4_log2 = ([x, y, z, w]: Vec4): Vec4 => [Math.log2(x), Math.log2(y), Math.log2(z), Math.log2(w)];
export const Vec4_sqrt = ([x, y, z, w]: Vec4): Vec4 => [Math.sqrt(x), Math.sqrt(y), Math.sqrt(z), Math.sqrt(w)];

// Helper functions needed by some of the above
export const Vec4_subtract = ([x1, y1, z1, w1]: Vec4, [x2, y2, z2, w2]: Vec4): Vec4 => [
    x1 - x2,
    y1 - y2,
    z1 - z2,
    w1 - w2
];
export const Vec4_scale = ([x, y, z, w]: Vec4, s: number): Vec4 => [x * s, y * s, z * s, w * s];
export const Vec4_negate = ([x, y, z, w]: Vec4): Vec4 => [-x, -y, -z, -w]; 