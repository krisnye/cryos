import type { Vec2 } from './Vec2';

// Mathematical Operations
export const Vec2_abs = ([x, y]: Vec2): Vec2 => [Math.abs(x), Math.abs(y)];
export const Vec2_ceil = ([x, y]: Vec2): Vec2 => [Math.ceil(x), Math.ceil(y)];
export const Vec2_floor = ([x, y]: Vec2): Vec2 => [Math.floor(x), Math.floor(y)];
export const Vec2_round = ([x, y]: Vec2): Vec2 => [Math.round(x), Math.round(y)];
export const Vec2_trunc = ([x, y]: Vec2): Vec2 => [Math.trunc(x), Math.trunc(y)];
export const Vec2_min = ([x1, y1]: Vec2, [x2, y2]: Vec2): Vec2 => [Math.min(x1, x2), Math.min(y1, y2)];
export const Vec2_max = ([x1, y1]: Vec2, [x2, y2]: Vec2): Vec2 => [Math.max(x1, x2), Math.max(y1, y2)];
export const Vec2_clamp = (v: Vec2, min: Vec2, max: Vec2): Vec2 => Vec2_min(Vec2_max(v, min), max);
export const Vec2_mix = ([x1, y1]: Vec2, [x2, y2]: Vec2, t: number): Vec2 => [
    x1 * (1 - t) + x2 * t,
    y1 * (1 - t) + y2 * t
];
export const Vec2_step = ([edge1, edge2]: Vec2, [x, y]: Vec2): Vec2 => [
    x < edge1 ? 0 : 1,
    y < edge2 ? 0 : 1
];
export const Vec2_smoothstep = ([e0x, e0y]: Vec2, [e1x, e1y]: Vec2, [x, y]: Vec2): Vec2 => {
    const tx = Math.max(0, Math.min(1, (x - e0x) / (e1x - e0x)));
    const ty = Math.max(0, Math.min(1, (y - e0y) / (e1y - e0y)));
    return [tx * tx * (3 - 2 * tx), ty * ty * (3 - 2 * ty)];
};

// Geometric Functions
export const Vec2_length = ([x, y]: Vec2): number => Math.sqrt(x * x + y * y);
export const Vec2_distance = (a: Vec2, b: Vec2): number => Vec2_length(Vec2_subtract(b, a));
export const Vec2_dot = ([x1, y1]: Vec2, [x2, y2]: Vec2): number => x1 * x2 + y1 * y2;
export const Vec2_normalize = (v: Vec2): Vec2 => {
    const len = Vec2_length(v);
    return len === 0 ? [0, 0] : Vec2_scale(v, 1 / len);
};
export const Vec2_faceforward = (n: Vec2, i: Vec2, nref: Vec2): Vec2 => 
    Vec2_dot(nref, i) < 0 ? n : Vec2_negate(n);
export const Vec2_reflect = (i: Vec2, n: Vec2): Vec2 => {
    const dot2 = Vec2_dot(n, i) * 2;
    return Vec2_subtract(i, Vec2_scale(n, dot2));
};
export const Vec2_refract = (i: Vec2, n: Vec2, eta: number): Vec2 => {
    const dot = Vec2_dot(n, i);
    const k = 1.0 - eta * eta * (1.0 - dot * dot);
    if (k < 0.0) {
        return [0, 0];
    }
    const scale = eta * dot + Math.sqrt(k);
    return Vec2_subtract(Vec2_scale(i, eta), Vec2_scale(n, scale));
};

// Trigonometric Functions
export const Vec2_sin = ([x, y]: Vec2): Vec2 => [Math.sin(x), Math.sin(y)];
export const Vec2_cos = ([x, y]: Vec2): Vec2 => [Math.cos(x), Math.cos(y)];
export const Vec2_tan = ([x, y]: Vec2): Vec2 => [Math.tan(x), Math.tan(y)];
export const Vec2_asin = ([x, y]: Vec2): Vec2 => [Math.asin(x), Math.asin(y)];
export const Vec2_acos = ([x, y]: Vec2): Vec2 => [Math.acos(x), Math.acos(y)];
export const Vec2_atan = ([x, y]: Vec2): Vec2 => [Math.atan(x), Math.atan(y)];
export const Vec2_sinh = ([x, y]: Vec2): Vec2 => [Math.sinh(x), Math.sinh(y)];
export const Vec2_cosh = ([x, y]: Vec2): Vec2 => [Math.cosh(x), Math.cosh(y)];
export const Vec2_tanh = ([x, y]: Vec2): Vec2 => [Math.tanh(x), Math.tanh(y)];
export const Vec2_asinh = ([x, y]: Vec2): Vec2 => [Math.asinh(x), Math.asinh(y)];
export const Vec2_acosh = ([x, y]: Vec2): Vec2 => [Math.acosh(x), Math.acosh(y)];
export const Vec2_atanh = ([x, y]: Vec2): Vec2 => [Math.atanh(x), Math.atanh(y)];

// Common Functions
export const Vec2_sign = ([x, y]: Vec2): Vec2 => [Math.sign(x), Math.sign(y)];
export const Vec2_fract = ([x, y]: Vec2): Vec2 => [x - Math.floor(x), y - Math.floor(y)];
export const Vec2_mod = ([x, y]: Vec2, m: number): Vec2 => [
    ((x % m) + m) % m,
    ((y % m) + m) % m
];
export const Vec2_modf = ([x, y]: Vec2): { fract: Vec2; whole: Vec2 } => ({
    whole: [Math.trunc(x), Math.trunc(y)],
    fract: [x - Math.trunc(x), y - Math.trunc(y)]
});
export const Vec2_pow = ([x1, y1]: Vec2, [x2, y2]: Vec2): Vec2 => [
    Math.pow(x1, x2),
    Math.pow(y1, y2)
];
export const Vec2_exp = ([x, y]: Vec2): Vec2 => [Math.exp(x), Math.exp(y)];
export const Vec2_exp2 = ([x, y]: Vec2): Vec2 => [Math.pow(2, x), Math.pow(2, y)];
export const Vec2_log = ([x, y]: Vec2): Vec2 => [Math.log(x), Math.log(y)];
export const Vec2_log2 = ([x, y]: Vec2): Vec2 => [Math.log2(x), Math.log2(y)];
export const Vec2_sqrt = ([x, y]: Vec2): Vec2 => [Math.sqrt(x), Math.sqrt(y)];

// Helper functions needed by some of the above
export const Vec2_subtract = ([x1, y1]: Vec2, [x2, y2]: Vec2): Vec2 => [x1 - x2, y1 - y2];
export const Vec2_scale = ([x, y]: Vec2, s: number): Vec2 => [x * s, y * s];
export const Vec2_negate = ([x, y]: Vec2): Vec2 => [-x, -y]; 