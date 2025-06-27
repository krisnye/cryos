import { describe, it, expect } from "vitest";
import { worldToScreen, isWorldPositionVisible, getWorldPositionDepth } from "./world-to-screen.js";
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
        const screenPos = worldToScreen([0, 0, 0], camera, canvasWidth, canvasHeight);
        expect(screenPos[0]).toBeCloseTo(canvasWidth / 2, 0);
        expect(screenPos[1]).toBeCloseTo(canvasHeight / 2, 0);
    });

    it("should convert positive X world position to right side of screen", () => {
        const screenPos = worldToScreen([5, 0, 0], camera, canvasWidth, canvasHeight);
        expect(screenPos[0]).toBeGreaterThan(canvasWidth / 2);
        expect(screenPos[1]).toBeCloseTo(canvasHeight / 2, 0);
    });

    it("should convert negative X world position to left side of screen", () => {
        const screenPos = worldToScreen([-5, 0, 0], camera, canvasWidth, canvasHeight);
        expect(screenPos[0]).toBeLessThan(canvasWidth / 2);
        expect(screenPos[1]).toBeCloseTo(canvasHeight / 2, 0);
    });

    it("should convert positive Y world position to top of screen", () => {
        const screenPos = worldToScreen([0, 5, 0], camera, canvasWidth, canvasHeight);
        expect(screenPos[0]).toBeCloseTo(canvasWidth / 2, 0);
        expect(screenPos[1]).toBeLessThan(canvasHeight / 2);
    });

    it("should convert negative Y world position to bottom of screen", () => {
        const screenPos = worldToScreen([0, -5, 0], camera, canvasWidth, canvasHeight);
        expect(screenPos[0]).toBeCloseTo(canvasWidth / 2, 0);
        expect(screenPos[1]).toBeGreaterThan(canvasHeight / 2);
    });

    it("should handle positions behind camera", () => {
        const screenPos = worldToScreen([0, 0, 20], camera, canvasWidth, canvasHeight);
        // Should be behind camera, so screen coordinates might be invalid
        expect(screenPos[0]).toBeGreaterThan(canvasWidth);
        expect(screenPos[1]).toBeGreaterThan(canvasHeight);
    });

    it("should handle positions very close to camera", () => {
        const screenPos = worldToScreen([0, 0, 0.5], camera, canvasWidth, canvasHeight);
        expect(screenPos[0]).toBeCloseTo(canvasWidth / 2, 0);
        expect(screenPos[1]).toBeCloseTo(canvasHeight / 2, 0);
    });

    it("should handle different canvas aspect ratios", () => {
        const squareCanvas = worldToScreen([0, 0, 0], camera, 1000, 1000);
        const wideCanvas = worldToScreen([0, 0, 0], camera, 2000, 1000);
        
        expect(squareCanvas[0]).toBeCloseTo(500, 0);
        expect(squareCanvas[1]).toBeCloseTo(500, 0);
        expect(wideCanvas[0]).toBeCloseTo(1000, 0);
        expect(wideCanvas[1]).toBeCloseTo(500, 0);
    });
});

describe("isWorldPositionVisible", () => {
    const camera = createTestCamera();
    const canvasWidth = 1600;
    const canvasHeight = 900;

    describe("point visibility (radius = 0)", () => {
        it("should return true for point at screen center", () => {
            const isVisible = isWorldPositionVisible([0, 0, 0], camera, canvasWidth, canvasHeight);
            expect(isVisible).toBe(true);
        });

        it("should return true for point within screen bounds", () => {
            const isVisible = isWorldPositionVisible([2, 1, 0], camera, canvasWidth, canvasHeight);
            expect(isVisible).toBe(true);
        });

        it("should return false for point outside screen bounds", () => {
            const isVisible = isWorldPositionVisible([20, 0, 0], camera, canvasWidth, canvasHeight);
            expect(isVisible).toBe(false);
        });

        it("should return false for point behind camera", () => {
            const isVisible = isWorldPositionVisible([0, 0, 20], camera, canvasWidth, canvasHeight);
            expect(isVisible).toBe(false);
        });

        it("should return false for point far to the left", () => {
            const isVisible = isWorldPositionVisible([-20, 0, 0], camera, canvasWidth, canvasHeight);
            expect(isVisible).toBe(false);
        });

        it("should return false for point far to the right", () => {
            const isVisible = isWorldPositionVisible([20, 0, 0], camera, canvasWidth, canvasHeight);
            expect(isVisible).toBe(false);
        });

        it("should return false for point far above", () => {
            const isVisible = isWorldPositionVisible([0, 20, 0], camera, canvasWidth, canvasHeight);
            expect(isVisible).toBe(false);
        });

        it("should return false for point far below", () => {
            const isVisible = isWorldPositionVisible([0, -20, 0], camera, canvasWidth, canvasHeight);
            expect(isVisible).toBe(false);
        });
    });

    describe("bounding sphere visibility (radius > 0)", () => {
        it("should return true when sphere center is visible", () => {
            const isVisible = isWorldPositionVisible([0, 0, 0], camera, canvasWidth, canvasHeight, 2);
            expect(isVisible).toBe(true);
        });

        it("should return true when sphere extends into view from left", () => {
            const isVisible = isWorldPositionVisible([-8, 0, 0], camera, canvasWidth, canvasHeight, 2);
            expect(isVisible).toBe(true);
        });

        it("should return true when sphere extends into view from right", () => {
            const isVisible = isWorldPositionVisible([8, 0, 0], camera, canvasWidth, canvasHeight, 2);
            expect(isVisible).toBe(true);
        });

        it("should return true when sphere extends into view from top", () => {
            const isVisible = isWorldPositionVisible([0, 8, 0], camera, canvasWidth, canvasHeight, 8);
            expect(isVisible).toBe(true);
        });

        it("should return true when sphere extends into view from bottom", () => {
            const isVisible = isWorldPositionVisible([0, -8, 0], camera, canvasWidth, canvasHeight, 8);
            expect(isVisible).toBe(true);
        });

        it("should return true when sphere extends into view from front", () => {
            const isVisible = isWorldPositionVisible([0, 0, 2], camera, canvasWidth, canvasHeight, 2);
            expect(isVisible).toBe(true);
        });

        it("should return true when sphere extends into view from back", () => {
            const isVisible = isWorldPositionVisible([0, 0, -2], camera, canvasWidth, canvasHeight, 2);
            expect(isVisible).toBe(true);
        });

        it("should return false when sphere is completely outside view", () => {
            const isVisible = isWorldPositionVisible([-20, 0, 0], camera, canvasWidth, canvasHeight, 2);
            expect(isVisible).toBe(false);
        });

        it("should return true when sphere is behind camera but extends into view", () => {
            const isVisible = isWorldPositionVisible([0, 0, 12], camera, canvasWidth, canvasHeight, 3);
            expect(isVisible).toBe(true);
        });

        it("should return false when sphere is behind camera and doesn't extend into view", () => {
            const isVisible = isWorldPositionVisible([0, 0, 15], camera, canvasWidth, canvasHeight, 2);
            expect(isVisible).toBe(false);
        });

        it("should handle very large spheres", () => {
            const isVisible = isWorldPositionVisible([0, 0, 0], camera, canvasWidth, canvasHeight, 100);
            expect(isVisible).toBe(true);
        });

        it("should handle very small spheres", () => {
            const isVisible = isWorldPositionVisible([0, 0, 0], camera, canvasWidth, canvasHeight, 0.1);
            expect(isVisible).toBe(true);
        });
    });

    describe("edge cases", () => {
        it("should handle zero radius explicitly", () => {
            const isVisible = isWorldPositionVisible([0, 0, 0], camera, canvasWidth, canvasHeight, 0);
            expect(isVisible).toBe(true);
        });

        it("should handle negative radius", () => {
            const isVisible = isWorldPositionVisible([0, 0, 0], camera, canvasWidth, canvasHeight, -1);
            expect(isVisible).toBe(true);
        });

        it("should handle camera at different positions", () => {
            const offsetCamera: Camera = {
                ...camera,
                position: [5, 5, 10],
                target: [5, 5, 0],
            };
            const isVisible = isWorldPositionVisible([5, 5, 0], offsetCamera, canvasWidth, canvasHeight, 1);
            expect(isVisible).toBe(true);
        });

        it("should handle different field of view", () => {
            const wideFOVCamera: Camera = {
                ...camera,
                fieldOfView: Math.PI / 2, // 90 degrees
            };
            const isVisible = isWorldPositionVisible([0, 0, 0], wideFOVCamera, canvasWidth, canvasHeight, 1);
            expect(isVisible).toBe(true);
        });
    });
});

describe("getWorldPositionDepth", () => {
    const camera = createTestCamera();

    it("should return ~0.5 for position at near plane", () => {
        const depth = getWorldPositionDepth([0, 0, 0.1], camera);
        expect(depth).toBeCloseTo(0.5, 2);
    });

    it("should return 2 for position at far plane (behind camera)", () => {
        const depth = getWorldPositionDepth([0, 0, 100], camera);
        expect(depth).toBe(2);
    });

    it("should return ~0.5 for position at middle distance in front of camera", () => {
        const depth = getWorldPositionDepth([0, 0, 5], camera);
        expect(depth).toBeCloseTo(0.5, 2);
    });

    it("should return values between 0 and 1 for positions in range", () => {
        const depth1 = getWorldPositionDepth([0, 0, 1], camera);
        const depth2 = getWorldPositionDepth([0, 0, 2], camera);
        const depth3 = getWorldPositionDepth([0, 0, 5], camera);
        expect(depth1).toBeGreaterThanOrEqual(0);
        expect(depth1).toBeLessThanOrEqual(1);
        expect(depth2).toBeGreaterThanOrEqual(0);
        expect(depth2).toBeLessThanOrEqual(1);
        expect(depth3).toBeGreaterThanOrEqual(0);
        expect(depth3).toBeLessThanOrEqual(1);
    });

    it("should handle positions behind camera", () => {
        const depth = getWorldPositionDepth([0, 0, 20], camera);
        expect(depth).toBe(2);
    });

    it("should handle positions very close to camera", () => {
        const depth = getWorldPositionDepth([0, 0, 0.5], camera);
        expect(depth).toBeCloseTo(0.5, 2);
    });

    it("should be consistent with worldToScreen for visible positions", () => {
        const worldPos: [number, number, number] = [2, 1, 5];
        const depth = getWorldPositionDepth(worldPos, camera);
        const screenPos = worldToScreen(worldPos, camera, 1600, 900);
        expect(depth).toBeGreaterThanOrEqual(0);
        expect(depth).toBeLessThanOrEqual(1);
        expect(screenPos[0]).toBeGreaterThanOrEqual(0);
        expect(screenPos[0]).toBeLessThanOrEqual(1600);
        expect(screenPos[1]).toBeGreaterThanOrEqual(0);
        expect(screenPos[1]).toBeLessThanOrEqual(900);
    });
}); 