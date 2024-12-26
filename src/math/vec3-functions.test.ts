import { expect, test, describe } from "vitest";
import { add, sub, mul, div, scale, dot, cross, normalize, length, lengthSquared, mix, equivalent } from "./vec3-functions.js";
import type { Vec3 } from "../types/data-types.js";

describe("vec3-functions", () => {
    const v1: Vec3 = [1, 2, 3];
    const v2: Vec3 = [4, 5, 6];
    const v3: Vec3 = [-1, -2, -3];

    test("add", () => {
        expect(add(v1, v2)).toEqual([5, 7, 9]);
        expect(add(v1, v3)).toEqual([0, 0, 0]);
    });

    test("sub", () => {
        expect(sub(v1, v2)).toEqual([-3, -3, -3]);
        expect(sub(v2, v1)).toEqual([3, 3, 3]);
    });

    test("mul", () => {
        expect(mul(v1, v2)).toEqual([4, 10, 18]);
        expect(mul(v2, v2)).toEqual([16, 25, 36]);
    });

    test("div", () => {
        expect(div([4, 6, 8], [2, 3, 4])).toEqual([2, 2, 2]);
        expect(div(v2, v1)).toEqual([4, 2.5, 2]);
    });

    test("scale", () => {
        expect(scale(v1, 2)).toEqual([2, 4, 6]);
        expect(scale(v2, -1)).toEqual([-4, -5, -6]);
    });

    test("dot", () => {
        expect(dot(v1, v2)).toEqual(32);  // 1*4 + 2*5 + 3*6
        expect(dot(v1, v1)).toEqual(14);  // 1*1 + 2*2 + 3*3
    });

    test("cross", () => {
        expect(cross([1, 0, 0], [0, 1, 0])).toEqual([0, 0, 1]);
        expect(cross(v1, v2)).toEqual([-3, 6, -3]); // [2*6-3*5, 3*4-1*6, 1*5-2*4]
    });

    test("length", () => {
        expect(length([3, 4, 0])).toEqual(5);
        expect(length([1, 0, 0])).toEqual(1);
        expect(length([0, 0, 0])).toEqual(0);
    });

    test("lengthSquared", () => {
        expect(lengthSquared([3, 4, 0])).toEqual(25);
        expect(lengthSquared(v1)).toEqual(14);
    });

    test("normalize", () => {
        const norm = normalize([0, 3, 4]);
        expect(norm[0]).toEqual(0);
        expect(norm[1]).toBeCloseTo(0.6);
        expect(norm[2]).toBeCloseTo(0.8);
        expect(length(norm)).toBeCloseTo(1);
    });

    test("mix", () => {
        const mixed = mix(v1, v2, 0.5);
        expect(mixed).toEqual([2.5, 3.5, 4.5]);
    });

    test("equivalent", () => {
        expect(equivalent(v1, v1)).toBe(true);
        expect(equivalent(v1, v2)).toBe(false);
        expect(equivalent(
            [0.1 + 0.2, 0, 0],
            [0.3, 0, 0],
            1e-10
        )).toBe(true);
    });
}); 