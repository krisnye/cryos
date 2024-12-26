import { expect, test, describe } from "vitest";
import { add, sub, mul, div, scale, dot, normalize, length, lengthSquared, mix, equivalent } from "./vec2-functions.js";
import type { Vec2 } from "../types/data-types.js";

describe("vec2-functions", () => {
    const v1: Vec2 = [1, 2];
    const v2: Vec2 = [3, 4];
    const v3: Vec2 = [-1, -2];

    test("add", () => {
        expect(add(v1, v2)).toEqual([4, 6]);
        expect(add(v1, v3)).toEqual([0, 0]);
    });

    test("sub", () => {
        expect(sub(v1, v2)).toEqual([-2, -2]);
        expect(sub(v2, v1)).toEqual([2, 2]);
    });

    test("mul", () => {
        expect(mul(v1, v2)).toEqual([3, 8]);
        expect(mul(v2, v2)).toEqual([9, 16]);
    });

    test("div", () => {
        expect(div([4, 6], [2, 3])).toEqual([2, 2]);
        expect(div(v2, v1)).toEqual([3, 2]);
    });

    test("scale", () => {
        expect(scale(v1, 2)).toEqual([2, 4]);
        expect(scale(v2, -1)).toEqual([-3, -4]);
    });

    test("dot", () => {
        expect(dot(v1, v2)).toEqual(11);  // 1*3 + 2*4
        expect(dot(v1, v1)).toEqual(5);   // 1*1 + 2*2
    });

    test("length", () => {
        expect(length([3, 4])).toEqual(5);
        expect(length([1, 0])).toEqual(1);
        expect(length([0, 0])).toEqual(0);
    });

    test("lengthSquared", () => {
        expect(lengthSquared([3, 4])).toEqual(25);
        expect(lengthSquared(v1)).toEqual(5);
    });

    test("normalize", () => {
        const norm = normalize([3, 4]);
        expect(norm[0]).toBeCloseTo(0.6);
        expect(norm[1]).toBeCloseTo(0.8);
        expect(length(norm)).toBeCloseTo(1);
    });

    test("mix", () => {
        const mixed = mix(v1, v2, 0.5);
        expect(mixed).toEqual([2, 3]);
    });

    test("equivalent", () => {
        expect(equivalent(v1, v1)).toBe(true);
        expect(equivalent(v1, v2)).toBe(false);
        expect(equivalent(
            [0.1 + 0.2, 0],
            [0.3, 0],
            1e-10
        )).toBe(true);
    });
}); 