import { describe, it, expect } from "vitest";
import { worldToScreen } from "./world-to-screen.js";
import type { Camera } from "./camera.js";

// Helper function to create a standard camera for testing
const createTestCamera = (): Camera => ({
    aspect: 16 / 9,
    fieldOfView: Math.PI / 4,
    nearPlane: 0.1,
    farPlane: 100.0,
    position: [0, 0, 10],
    target: [0, 0, 0],
    up: [0, 1, 0],
});

describe("worldToScreen", () => {
    const camera = createTestCamera();
    const canvasWidth = 1600;
    const canvasHeight = 900;

    it("should convert world position at origin to screen center", () => {
        const [screenX, screenY, depth] = worldToScreen([0, 0, 0], camera, canvasWidth, canvasHeight);
        expect(screenX).toBeCloseTo(canvasWidth / 2, 0);
        expect(screenY).toBeCloseTo(canvasHeight / 2, 0);
        expect(depth).toBeGreaterThanOrEqual(0);
        expect(depth).toBeLessThanOrEqual(1);
    });

    it("should convert positive X world position to right side of screen", () => {
        const [screenX, screenY, depth] = worldToScreen([5, 0, 0], camera, canvasWidth, canvasHeight);
        expect(screenX).toBeGreaterThan(canvasWidth / 2);
        expect(screenY).toBeCloseTo(canvasHeight / 2, 0);
        expect(depth).toBeGreaterThanOrEqual(0);
        expect(depth).toBeLessThanOrEqual(1);
    });

    it("should convert negative X world position to left side of screen", () => {
        const [screenX, screenY, depth] = worldToScreen([-5, 0, 0], camera, canvasWidth, canvasHeight);
        expect(screenX).toBeLessThan(canvasWidth / 2);
        expect(screenY).toBeCloseTo(canvasHeight / 2, 0);
        expect(depth).toBeGreaterThanOrEqual(0);
        expect(depth).toBeLessThanOrEqual(1);
    });

    it("should convert positive Y world position to top of screen", () => {
        const [screenX, screenY, depth] = worldToScreen([0, 5, 0], camera, canvasWidth, canvasHeight);
        expect(screenX).toBeCloseTo(canvasWidth / 2, 0);
        expect(screenY).toBeLessThan(canvasHeight / 2);
        expect(depth).toBeGreaterThanOrEqual(0);
        expect(depth).toBeLessThanOrEqual(1);
    });

    it("should convert negative Y world position to bottom of screen", () => {
        const [screenX, screenY, depth] = worldToScreen([0, -5, 0], camera, canvasWidth, canvasHeight);
        expect(screenX).toBeCloseTo(canvasWidth / 2, 0);
        expect(screenY).toBeGreaterThan(canvasHeight / 2);
        expect(depth).toBeGreaterThanOrEqual(0);
        expect(depth).toBeLessThanOrEqual(1);
    });

    it("should handle positions behind camera", () => {
        const [screenX, screenY, depth] = worldToScreen([0, 0, 20], camera, canvasWidth, canvasHeight);
        // Should be behind camera, so screen coordinates might be invalid and depth should be 2
        expect(screenX).toBeGreaterThan(canvasWidth);
        expect(screenY).toBeGreaterThan(canvasHeight);
        expect(depth).toBe(2);
    });

    it("should handle positions very close to camera", () => {
        const [screenX, screenY, depth] = worldToScreen([0, 0, 0.5], camera, canvasWidth, canvasHeight);
        expect(screenX).toBeCloseTo(canvasWidth / 2, 0);
        expect(screenY).toBeCloseTo(canvasHeight / 2, 0);
        expect(depth).toBeGreaterThanOrEqual(0);
        expect(depth).toBeLessThanOrEqual(1);
    });

    it("should handle different canvas aspect ratios", () => {
        const [squareX, squareY, squareDepth] = worldToScreen([0, 0, 0], camera, 1000, 1000);
        const [wideX, wideY, wideDepth] = worldToScreen([0, 0, 0], camera, 2000, 1000);
        
        expect(squareX).toBeCloseTo(500, 0);
        expect(squareY).toBeCloseTo(500, 0);
        expect(wideX).toBeCloseTo(1000, 0);
        expect(wideY).toBeCloseTo(500, 0);
        expect(squareDepth).toBeCloseTo(wideDepth, 2);
    });

    it("should return consistent depth values", () => {
        const [x1, y1, depth1] = worldToScreen([0, 0, 5], camera, canvasWidth, canvasHeight);
        const [x2, y2, depth2] = worldToScreen([0, 0, 5], camera, canvasWidth, canvasHeight);
        expect(depth1).toBeCloseTo(depth2, 6);
    });

    describe("depth calculation", () => {
        it("should return ~0.5 for position at near plane", () => {
            const [, , depth] = worldToScreen([0, 0, 0.1], camera, canvasWidth, canvasHeight);
            expect(depth).toBeCloseTo(0.5, 2);
        });

        it("should return 2 for position at far plane (behind camera)", () => {
            const [, , depth] = worldToScreen([0, 0, 100], camera, canvasWidth, canvasHeight);
            expect(depth).toBe(2);
        });

        it("should return ~0.5 for position at middle distance in front of camera", () => {
            const [, , depth] = worldToScreen([0, 0, 5], camera, canvasWidth, canvasHeight);
            expect(depth).toBeCloseTo(0.5, 2);
        });

        it("should return values between 0 and 1 for positions in range", () => {
            const [, , depth1] = worldToScreen([0, 0, 1], camera, canvasWidth, canvasHeight);
            const [, , depth2] = worldToScreen([0, 0, 2], camera, canvasWidth, canvasHeight);
            const [, , depth3] = worldToScreen([0, 0, 5], camera, canvasWidth, canvasHeight);
            expect(depth1).toBeGreaterThanOrEqual(0);
            expect(depth1).toBeLessThanOrEqual(1);
            expect(depth2).toBeGreaterThanOrEqual(0);
            expect(depth2).toBeLessThanOrEqual(1);
            expect(depth3).toBeGreaterThanOrEqual(0);
            expect(depth3).toBeLessThanOrEqual(1);
        });

        it("should handle positions behind camera", () => {
            const [, , depth] = worldToScreen([0, 0, 20], camera, canvasWidth, canvasHeight);
            expect(depth).toBe(2);
        });

        it("should handle positions very close to camera", () => {
            const [, , depth] = worldToScreen([0, 0, 0.5], camera, canvasWidth, canvasHeight);
            expect(depth).toBeCloseTo(0.5, 2);
        });

        it("should be consistent for visible positions", () => {
            const worldPos: [number, number, number] = [2, 1, 5];
            const [screenX, screenY, depth] = worldToScreen(worldPos, camera, canvasWidth, canvasHeight);
            expect(depth).toBeGreaterThanOrEqual(0);
            expect(depth).toBeLessThanOrEqual(1);
            expect(screenX).toBeGreaterThanOrEqual(0);
            expect(screenX).toBeLessThanOrEqual(canvasWidth);
            expect(screenY).toBeGreaterThanOrEqual(0);
            expect(screenY).toBeLessThanOrEqual(canvasHeight);
        });
    });
}); 