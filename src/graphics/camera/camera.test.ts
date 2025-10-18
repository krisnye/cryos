import { describe, it, expect } from "vitest";
import { Camera } from "./camera.js";
import { Mat4x4, Vec3 } from "@adobe/data/math";

// Helper function to create a standard camera for testing
const createTestCamera = (): Camera => ({
    aspect: 16 / 9,
    fieldOfView: Math.PI / 4,
    nearPlane: 0.1,
    farPlane: 100.0,
    position: [0, 0, 10],
    target: [0, 0, 0],
    up: [0, 1, 0],
    orthographic: 0,
});

describe("toViewProjection", () => {
    it("should return a valid 4x4 matrix", () => {
        const camera = createTestCamera();
        const viewProjection = Camera.toViewProjection(camera);
        
        expect(viewProjection).toBeDefined();
        expect(viewProjection.length).toBe(16);
        expect(viewProjection.every(n => typeof n === 'number')).toBe(true);
    });

    it("should return an invertible matrix", () => {
        const camera = createTestCamera();
        const viewProjection = Camera.toViewProjection(camera);
        
        // If the matrix is valid, it should be invertible
        const inverse = Mat4x4.inverse(viewProjection);
        expect(inverse).toBeDefined();
        
        // Multiplying by its inverse should give identity (within floating point tolerance)
        const product = Mat4x4.multiply(viewProjection, inverse);
        const identity = Mat4x4.identity;
        
        for (let i = 0; i < 16; i++) {
            expect(product[i]).toBeCloseTo(identity[i], 4);
        }
    });

    it("should transform origin to clip space center when camera looks at origin", () => {
        const camera = createTestCamera();
        const viewProjection = Camera.toViewProjection(camera);
        
        // Transform origin point [0, 0, 0] to clip space
        const clipSpace = Mat4x4.multiplyVec4(viewProjection, [0, 0, 0, 1]);
        
        // After perspective divide, should be at center (0, 0)
        const ndcX = clipSpace[0] / clipSpace[3];
        const ndcY = clipSpace[1] / clipSpace[3];
        
        expect(ndcX).toBeCloseTo(0, 4);
        expect(ndcY).toBeCloseTo(0, 4);
    });

    it("should transform points to the right of target to positive X in clip space", () => {
        const camera = createTestCamera();
        const viewProjection = Camera.toViewProjection(camera);
        
        // Point to the right of origin when viewed from [0, 0, 10]
        const clipSpace = Mat4x4.multiplyVec4(viewProjection, [5, 0, 0, 1]);
        
        // After perspective divide, X should be positive
        const ndcX = clipSpace[0] / clipSpace[3];
        expect(ndcX).toBeGreaterThan(0);
    });

    it("should transform points to the left of target to negative X in clip space", () => {
        const camera = createTestCamera();
        const viewProjection = Camera.toViewProjection(camera);
        
        // Point to the left of origin when viewed from [0, 0, 10]
        const clipSpace = Mat4x4.multiplyVec4(viewProjection, [-5, 0, 0, 1]);
        
        // After perspective divide, X should be negative
        const ndcX = clipSpace[0] / clipSpace[3];
        expect(ndcX).toBeLessThan(0);
    });

    it("should transform points above target to positive Y in clip space", () => {
        const camera = createTestCamera();
        const viewProjection = Camera.toViewProjection(camera);
        
        // Point above origin when viewed from [0, 0, 10]
        const clipSpace = Mat4x4.multiplyVec4(viewProjection, [0, 5, 0, 1]);
        
        // After perspective divide, Y should be positive
        const ndcY = clipSpace[1] / clipSpace[3];
        expect(ndcY).toBeGreaterThan(0);
    });

    it("should transform points below target to negative Y in clip space", () => {
        const camera = createTestCamera();
        const viewProjection = Camera.toViewProjection(camera);
        
        // Point below origin when viewed from [0, 0, 10]
        const clipSpace = Mat4x4.multiplyVec4(viewProjection, [0, -5, 0, 1]);
        
        // After perspective divide, Y should be negative
        const ndcY = clipSpace[1] / clipSpace[3];
        expect(ndcY).toBeLessThan(0);
    });

    it("should handle camera at different position", () => {
        const camera: Camera = {
            ...createTestCamera(),
            position: [5, 5, 5],
            target: [0, 0, 0],
        };
        const viewProjection = Camera.toViewProjection(camera);
        
        // Should still be invertible
        const inverse = Mat4x4.inverse(viewProjection);
        expect(inverse).toBeDefined();
        
        // Target point should transform to near clip space center
        const clipSpace = Mat4x4.multiplyVec4(viewProjection, [0, 0, 0, 1]);
        const ndcX = clipSpace[0] / clipSpace[3];
        const ndcY = clipSpace[1] / clipSpace[3];
        
        expect(ndcX).toBeCloseTo(0, 4);
        expect(ndcY).toBeCloseTo(0, 4);
    });

    it("should handle different field of view", () => {
        const narrowFov: Camera = {
            ...createTestCamera(),
            fieldOfView: Math.PI / 8, // Narrow FOV
        };
        const wideFov: Camera = {
            ...createTestCamera(),
            fieldOfView: Math.PI / 2, // Wide FOV
        };
        
        const narrowVP = Camera.toViewProjection(narrowFov);
        const wideVP = Camera.toViewProjection(wideFov);
        
        // Same point should have different clip space positions
        const point: Vec3 = [5, 0, 0];
        const narrowClip = Mat4x4.multiplyVec4(narrowVP, [...point, 1]);
        const wideClip = Mat4x4.multiplyVec4(wideVP, [...point, 1]);
        
        const narrowNdcX = narrowClip[0] / narrowClip[3];
        const wideNdcX = wideClip[0] / wideClip[3];
        
        // Narrow FOV should "zoom in" more, making the same point further from center
        expect(Math.abs(narrowNdcX)).toBeGreaterThan(Math.abs(wideNdcX));
    });

    it("should handle different aspect ratios", () => {
        const squareAspect: Camera = {
            ...createTestCamera(),
            aspect: 1.0, // Square
        };
        const wideAspect: Camera = {
            ...createTestCamera(),
            aspect: 2.0, // Wide
        };
        
        const squareVP = Camera.toViewProjection(squareAspect);
        const wideVP = Camera.toViewProjection(wideAspect);
        
        expect(squareVP).toBeDefined();
        expect(wideVP).toBeDefined();
        
        // Both should be valid matrices
        const squareInverse = Mat4x4.inverse(squareVP);
        const wideInverse = Mat4x4.inverse(wideVP);
        
        expect(squareInverse).toBeDefined();
        expect(wideInverse).toBeDefined();
    });

    it("should handle different near and far planes", () => {
        const nearCamera: Camera = {
            ...createTestCamera(),
            nearPlane: 0.01,
            farPlane: 10.0,
        };
        const farCamera: Camera = {
            ...createTestCamera(),
            nearPlane: 1.0,
            farPlane: 1000.0,
        };
        
        const nearVP = Camera.toViewProjection(nearCamera);
        const farVP = Camera.toViewProjection(farCamera);
        
        expect(nearVP).toBeDefined();
        expect(farVP).toBeDefined();
        
        // Both should be invertible
        expect(Mat4x4.inverse(nearVP)).toBeDefined();
        expect(Mat4x4.inverse(farVP)).toBeDefined();
    });

    it("should be consistent for same camera parameters", () => {
        const camera = createTestCamera();
        const vp1 = Camera.toViewProjection(camera);
        const vp2 = Camera.toViewProjection(camera);
        
        // Should produce identical matrices
        for (let i = 0; i < 16; i++) {
            expect(vp1[i]).toBe(vp2[i]);
        }
    });

    it("should handle camera with different up vector", () => {
        const camera: Camera = {
            ...createTestCamera(),
            up: [1, 0, 0], // Different up vector
        };
        const viewProjection = Camera.toViewProjection(camera);
        
        expect(viewProjection).toBeDefined();
        expect(Mat4x4.inverse(viewProjection)).toBeDefined();
    });

    it("should produce different matrices for different camera positions", () => {
        const camera1: Camera = {
            ...createTestCamera(),
            position: [0, 0, 10],
        };
        const camera2: Camera = {
            ...createTestCamera(),
            position: [10, 0, 0],
        };
        
        const vp1 = Camera.toViewProjection(camera1);
        const vp2 = Camera.toViewProjection(camera2);
        
        // Matrices should be different
        let hasDifference = false;
        for (let i = 0; i < 16; i++) {
            if (vp1[i] !== vp2[i]) {
                hasDifference = true;
                break;
            }
        }
        expect(hasDifference).toBe(true);
    });
});

