import { expect, test, describe } from "vitest";
import { add, sub, mul, div, scale, dot, normalize, length, lengthSquared, mix, equivalent } from "./vec4-functions.js";
import type { Vec4 } from "../types/data-types.js";

describe("vec4-functions", () => {
    const v1: Vec4 = [1, 2, 3, 4];
    const v2: Vec4 = [5, 6, 7, 8];
    const v3: Vec4 = [-1, -2, -3, -4];

    test("add", () => {
        expect(add(v1, v2)).toEqual([6, 8, 10, 12]);
        expect(add(v1, v3)).toEqual([0, 0, 0, 0]);
    });

    test("sub", () => {
        expect(sub(v1, v2)).toEqual([-4, -4, -4, -4]);
        expect(sub(v2, v1)).toEqual([4, 4, 4, 4]);
    });

    test("mul", () => {
        expect(mul(v1, v2)).toEqual([5, 12, 21, 32]);
        expect(mul(v2, v2)).toEqual([25, 36, 49, 64]);
    });

    test("div", () => {
        expect(div([4, 6, 8, 10], [2, 3, 4, 5])).toEqual([2, 2, 2, 2]);
        expect(div(v2, v1)).toEqual([5, 3, 7/3, 2]);
    });

    test("scale", () => {
        expect(scale(v1, 2)).toEqual([2, 4, 6, 8]);
        expect(scale(v2, -1)).toEqual([-5, -6, -7, -8]);
    });

    test("dot", () => {
        expect(dot(v1, v2)).toEqual(70);  // 1*5 + 2*6 + 3*7 + 4*8
        expect(dot(v1, v1)).toEqual(30);  // 1*1 + 2*2 + 3*3 + 4*4
    });

    test("length", () => {
        expect(length([3, 4, 0, 0])).toEqual(5);
        expect(length([1, 0, 0, 0])).toEqual(1);
        expect(length([0, 0, 0, 0])).toEqual(0);
    });

    test("lengthSquared", () => {
        expect(lengthSquared([3, 4, 0, 0])).toEqual(25);
        expect(lengthSquared(v1)).toEqual(30);
    });

    test("normalize", () => {
        const norm = normalize([0, 3, 4, 0]);
        expect(norm[0]).toEqual(0);
        expect(norm[1]).toBeCloseTo(0.6);
        expect(norm[2]).toBeCloseTo(0.8);
        expect(norm[3]).toEqual(0);
        expect(length(norm)).toBeCloseTo(1);
    });

    test("mix", () => {
        const mixed = mix(v1, v2, 0.5);
        expect(mixed).toEqual([3, 4, 5, 6]);
    });

    test("equivalent", () => {
        expect(equivalent(v1, v1)).toBe(true);
        expect(equivalent(v1, v2)).toBe(false);
        expect(equivalent(
            [0.1 + 0.2, 0, 0, 0],
            [0.3, 0, 0, 0],
            1e-10
        )).toBe(true);
    });
}); 