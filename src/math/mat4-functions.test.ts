import { expect, test, describe } from "vitest";
import { 
    mul, inverse, transpose, identity,
    createScalingMat4, createTranslationMat4,
    createRotationXMat4, createRotationYMat4, createRotationZMat4,
    createPerspectiveMat4, createPerspectiveInfiniteMat4,
    createOrthographicMat4, createLookAtMat4,
    equivalent
} from "./mat4-functions.js";
import type { Mat4x4, Vec3 } from "../types/data-types.js";

describe("mat4-functions", () => {
    test("identity matrix properties", () => {
        const v: Mat4x4 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];
        expect(mul(identity, v)).toEqual(v);
        expect(mul(v, identity)).toEqual(v);
        expect(inverse(identity)).toEqual(identity);
        expect(transpose(identity)).toEqual(identity);
    });

    test("matrix multiplication", () => {
        const translation = createTranslationMat4(1, 2, 3);
        const scale = createScalingMat4(2);
        
        // Scale then translate
        const result = mul(translation, scale);
        expect(result[12]).toBe(1); // tx
        expect(result[13]).toBe(2); // ty
        expect(result[14]).toBe(3); // tz
        expect(result[0]).toBe(2);  // sx
        expect(result[5]).toBe(2);  // sy
        expect(result[10]).toBe(2); // sz
    });

    test("matrix inverse", () => {
        const m = createTranslationMat4(1, 2, 3);
        const inv = inverse(m);
        const result = mul(m, inv);
        expect(equivalent(result, identity)).toBe(true);
    });

    test("matrix transpose", () => {
        const m: Mat4x4 = [
            1, 2, 3, 4,
            5, 6, 7, 8,
            9, 10, 11, 12,
            13, 14, 15, 16
        ];
        const t = transpose(m);
        expect(t[1]).toBe(m[4]);
        expect(t[2]).toBe(m[8]);
        expect(t[3]).toBe(m[12]);
        expect(t[4]).toBe(m[1]);
    });

    test("scaling matrix", () => {
        const s2 = createScalingMat4(2);
        const s123 = createScalingMat4(1, 2, 3);
        
        expect(s2[0]).toBe(2);
        expect(s2[5]).toBe(2);
        expect(s2[10]).toBe(2);
        
        expect(s123[0]).toBe(1);
        expect(s123[5]).toBe(2);
        expect(s123[10]).toBe(3);
    });

    test("translation matrix", () => {
        const t = createTranslationMat4(1, 2, 3);
        expect(t[12]).toBe(1);
        expect(t[13]).toBe(2);
        expect(t[14]).toBe(3);
        expect(t[15]).toBe(1);
    });

    test("rotation matrices", () => {
        const rx = createRotationXMat4(Math.PI / 2);
        const ry = createRotationYMat4(Math.PI / 2);
        const rz = createRotationZMat4(Math.PI / 2);

        // Test that rotations preserve length
        const v: Vec3 = [1, 0, 0];
        const rotated = [
            rx[0] * v[0] + rx[4] * v[1] + rx[8] * v[2],
            rx[1] * v[0] + rx[5] * v[1] + rx[9] * v[2],
            rx[2] * v[0] + rx[6] * v[1] + rx[10] * v[2]
        ];
        expect(Math.hypot(...rotated)).toBeCloseTo(1);
    });

    test("perspective matrix", () => {
        const p = createPerspectiveMat4({
            fov: Math.PI / 4,
            aspect: 1.5,
            near: 0.1,
            far: 100
        });
        
        // Test that perspective matrix has expected properties
        expect(p[15]).toBe(0); // w component for perspective divide
        expect(p[11]).toBe(-1); // perspective divide coefficient
    });

    test("infinite perspective matrix", () => {
        const p = createPerspectiveInfiniteMat4({
            fov: Math.PI / 4,
            aspect: 1.5,
            near: 0.1
        });
        
        expect(p[10]).toBe(-1); // z coefficient for infinite far plane
        expect(p[11]).toBe(-1); // perspective divide coefficient
    });

    test("orthographic matrix", () => {
        const o = createOrthographicMat4({
            left: -1,
            right: 1,
            bottom: -1,
            top: 1,
            near: 0.1,
            far: 100
        });
        
        // Test that orthographic matrix preserves z for near plane
        const nearPoint: Vec3 = [0, 0, 0.1];
        const transformed = [
            o[0] * nearPoint[0] + o[12],
            o[5] * nearPoint[1] + o[13],
            o[10] * nearPoint[2] + o[14]
        ];
        expect(transformed[2]).toBeCloseTo(-1); // near plane should map to -1
    });

    test("lookAt matrix", () => {
        const view = createLookAtMat4({
            eye: [0, 0, 5],
            center: [0, 0, 0],
            up: [0, 1, 0]
        });
        
        // Looking down -Z axis from +Z, so forward direction should be negative
        expect(view[10]).toBeGreaterThan(0);
        // Up vector preserved
        expect(view[5]).toBeCloseTo(1);
    });
}); 