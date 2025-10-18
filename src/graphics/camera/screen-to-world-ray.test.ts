import { describe, it, expect } from "vitest";
import { Camera } from "../index.js";
import { Mat4x4 } from "@adobe/data/math";

describe("screenToWorldRay", () => {
    const createTestCamera = (): Camera => ({
        aspect: 16 / 9,
        fieldOfView: Math.PI / 4, // 45 degrees
        nearPlane: 0.1,
        farPlane: 100,
        position: [0, 0, 5],
        target: [0, 0, 0],
        up: [0, 1, 0],
        orthographic: 0,
    });

    it("converts screen center to ray pointing forward", () => {
        const camera = createTestCamera();
        const canvasWidth = 1600;
        const canvasHeight = 900;
        const screenCenter: [number, number] = [canvasWidth / 2, canvasHeight / 2];

        // Compute the inverse view-projection matrix
        const viewProjection = Camera.toViewProjection(camera);
        const invViewProjection = Mat4x4.inverse(viewProjection);

        const ray = Camera.screenToWorldRay(screenCenter, invViewProjection, canvasWidth, canvasHeight);

        // Ray should start at near plane point (not camera position)
        expect(ray.a[0]).toBeCloseTo(0, 1);
        expect(ray.a[1]).toBeCloseTo(0, 1);
        expect(ray.a[2]).toBeCloseTo(5, 1); // Near plane is actually at z = 5

        // Ray should point roughly toward the target (forward direction)
        const rayDirection = [
            ray.b[0] - ray.a[0],
            ray.b[1] - ray.a[1],
            ray.b[2] - ray.a[2]
        ];
        
        // Normalize the direction
        const length = Math.sqrt(rayDirection[0] ** 2 + rayDirection[1] ** 2 + rayDirection[2] ** 2);
        const normalizedDirection = [
            rayDirection[0] / length,
            rayDirection[1] / length,
            rayDirection[2] / length
        ];

        // Should point roughly forward (negative Z direction, into the scene)
        expect(normalizedDirection[0]).toBeCloseTo(0, 1);
        expect(normalizedDirection[1]).toBeCloseTo(0, 1);
        expect(normalizedDirection[2]).toBeCloseTo(-1, 1);
    });

    it("converts screen top-left to ray pointing left and up", () => {
        const camera = createTestCamera();
        const canvasWidth = 1600;
        const canvasHeight = 900;
        const screenTopLeft: [number, number] = [0, 0];

        // Compute the inverse view-projection matrix
        const viewProjection = Camera.toViewProjection(camera);
        const invViewProjection = Mat4x4.inverse(viewProjection);

        const ray = Camera.screenToWorldRay(screenTopLeft, invViewProjection, canvasWidth, canvasHeight);

        // Ray should start at near plane point
        expect(ray.a[2]).toBeCloseTo(5, 1); // Near plane

        // Ray should point left and up
        const rayDirection = [
            ray.b[0] - ray.a[0],
            ray.b[1] - ray.a[1],
            ray.b[2] - ray.a[2]
        ];
        
        // Normalize the direction
        const length = Math.sqrt(rayDirection[0] ** 2 + rayDirection[1] ** 2 + rayDirection[2] ** 2);
        const normalizedDirection = [
            rayDirection[0] / length,
            rayDirection[1] / length,
            rayDirection[2] / length
        ];

        // Should point left (negative X), up (positive Y), and forward (negative Z, into scene)
        expect(normalizedDirection[0]).toBeLessThan(0);
        expect(normalizedDirection[1]).toBeGreaterThan(0);
        expect(normalizedDirection[2]).toBeLessThan(0);
    });

    it("converts screen bottom-right to ray pointing right and down", () => {
        const camera = createTestCamera();
        const canvasWidth = 1600;
        const canvasHeight = 900;
        const screenBottomRight: [number, number] = [canvasWidth, canvasHeight];

        // Compute the inverse view-projection matrix
        const viewProjection = Camera.toViewProjection(camera);
        const invViewProjection = Mat4x4.inverse(viewProjection);

        const ray = Camera.screenToWorldRay(screenBottomRight, invViewProjection, canvasWidth, canvasHeight);

        // Ray should start at near plane point
        expect(ray.a[2]).toBeCloseTo(5, 1); // Near plane

        // Ray should point right and down
        const rayDirection = [
            ray.b[0] - ray.a[0],
            ray.b[1] - ray.a[1],
            ray.b[2] - ray.a[2]
        ];
        
        // Normalize the direction
        const length = Math.sqrt(rayDirection[0] ** 2 + rayDirection[1] ** 2 + rayDirection[2] ** 2);
        const normalizedDirection = [
            rayDirection[0] / length,
            rayDirection[1] / length,
            rayDirection[2] / length
        ];

        // Should point right (positive X), down (negative Y), and forward (negative Z, into scene)
        expect(normalizedDirection[0]).toBeGreaterThan(0);
        expect(normalizedDirection[1]).toBeLessThan(0);
        expect(normalizedDirection[2]).toBeLessThan(0);
    });

    it("respects custom ray length", () => {
        const camera = createTestCamera();
        const canvasWidth = 1600;
        const canvasHeight = 900;
        const screenCenter: [number, number] = [canvasWidth / 2, canvasHeight / 2];
        const customLength = 50;

        // Compute the inverse view-projection matrix
        const viewProjection = Camera.toViewProjection(camera);
        const invViewProjection = Mat4x4.inverse(viewProjection);

        const ray = Camera.screenToWorldRay(screenCenter, invViewProjection, canvasWidth, canvasHeight, customLength);

        // Ray should start at near plane point
        expect(ray.a[2]).toBeCloseTo(5, 1); // Near plane

        // Ray should have the specified length
        const rayDirection = [
            ray.b[0] - ray.a[0],
            ray.b[1] - ray.a[1],
            ray.b[2] - ray.a[2]
        ];
        const length = Math.sqrt(rayDirection[0] ** 2 + rayDirection[1] ** 2 + rayDirection[2] ** 2);
        expect(length).toBeCloseTo(customLength, 1);
    });

    it("works with different camera positions", () => {
        const camera: Camera = {
            aspect: 16 / 9,
            fieldOfView: Math.PI / 4,
            nearPlane: 0.1,
            farPlane: 100,
            position: [10, 5, 15],
            target: [0, 0, 0],
            up: [0, 1, 0],
            orthographic: 0,
        };
        const canvasWidth = 1600;
        const canvasHeight = 900;
        const screenCenter: [number, number] = [canvasWidth / 2, canvasHeight / 2];

        // Compute the inverse view-projection matrix
        const viewProjection = Camera.toViewProjection(camera);
        const invViewProjection = Mat4x4.inverse(viewProjection);

        const ray = Camera.screenToWorldRay(screenCenter, invViewProjection, canvasWidth, canvasHeight);

        // Ray should start at near plane point (not camera position)
        // The actual values depend on the camera setup, so let's just check they're reasonable
        expect(Math.abs(ray.a[0])).toBeLessThan(20);
        expect(Math.abs(ray.a[1])).toBeLessThan(20);
        expect(ray.a[2]).toBeCloseTo(15, 1); // Near plane should be close to camera z

        // Ray should point toward the target
        const rayDirection = [
            ray.b[0] - ray.a[0],
            ray.b[1] - ray.a[1],
            ray.b[2] - ray.a[2]
        ];
        // Find the closest point on the ray to the target
        const dx = ray.b[0] - ray.a[0];
        const dy = ray.b[1] - ray.a[1];
        const dz = ray.b[2] - ray.a[2];
        const t = (
            (camera.target[0] - ray.a[0]) * dx +
            (camera.target[1] - ray.a[1]) * dy +
            (camera.target[2] - ray.a[2]) * dz
        ) / (dx * dx + dy * dy + dz * dz);
        const closest = [
            ray.a[0] + t * dx,
            ray.a[1] + t * dy,
            ray.a[2] + t * dz
        ];
        const dist = Math.sqrt(
            (closest[0] - camera.target[0]) ** 2 +
            (closest[1] - camera.target[1]) ** 2 +
            (closest[2] - camera.target[2]) ** 2
        );
        expect(dist).toBeLessThan(1.0); // Ray passes close to the target
    });

    it("produces consistent results for same inputs", () => {
        const camera = createTestCamera();
        const canvasWidth = 1600;
        const canvasHeight = 900;
        const screenPos: [number, number] = [800, 450];

        const viewProjection = Camera.toViewProjection(camera);
        const invViewProjection = Mat4x4.inverse(viewProjection);

        const ray1 = Camera.screenToWorldRay(screenPos, invViewProjection, canvasWidth, canvasHeight);
        const ray2 = Camera.screenToWorldRay(screenPos, invViewProjection, canvasWidth, canvasHeight);

        // Should produce identical rays
        expect(ray1.a[0]).toBe(ray2.a[0]);
        expect(ray1.a[1]).toBe(ray2.a[1]);
        expect(ray1.a[2]).toBe(ray2.a[2]);
        expect(ray1.b[0]).toBe(ray2.b[0]);
        expect(ray1.b[1]).toBe(ray2.b[1]);
        expect(ray1.b[2]).toBe(ray2.b[2]);
    });

    it("works with different aspect ratios", () => {
        const squareCamera: Camera = {
            aspect: 1.0, // Square
            fieldOfView: Math.PI / 4,
            nearPlane: 0.1,
            farPlane: 100,
            position: [0, 0, 5],
            target: [0, 0, 0],
            up: [0, 1, 0],
            orthographic: 0,
        };
        const wideCamera: Camera = {
            aspect: 2.0, // Wide
            fieldOfView: Math.PI / 4,
            nearPlane: 0.1,
            farPlane: 100,
            position: [0, 0, 5],
            target: [0, 0, 0],
            up: [0, 1, 0],
            orthographic: 0,
        };
        const canvasWidth = 1600;
        const canvasHeight = 900;
        const screenRight: [number, number] = [canvasWidth, canvasHeight / 2];

        const squareVP = Camera.toViewProjection(squareCamera);
        const wideVP = Camera.toViewProjection(wideCamera);
        const squareInv = Mat4x4.inverse(squareVP);
        const wideInv = Mat4x4.inverse(wideVP);

        const squareRay = Camera.screenToWorldRay(screenRight, squareInv, canvasWidth, canvasHeight);
        const wideRay = Camera.screenToWorldRay(screenRight, wideInv, canvasWidth, canvasHeight);

        // Both should produce valid rays
        expect(squareRay.a).toBeDefined();
        expect(squareRay.b).toBeDefined();
        expect(wideRay.a).toBeDefined();
        expect(wideRay.b).toBeDefined();

        // Wide aspect should have different horizontal direction
        const squareDir = squareRay.b[0] - squareRay.a[0];
        const wideDir = wideRay.b[0] - wideRay.a[0];
        expect(Math.abs(squareDir)).not.toBeCloseTo(Math.abs(wideDir), 0);
    });

    it("works with different field of view", () => {
        const narrowFov: Camera = {
            aspect: 16 / 9,
            fieldOfView: Math.PI / 8, // Narrow FOV
            nearPlane: 0.1,
            farPlane: 100,
            position: [0, 0, 5],
            target: [0, 0, 0],
            up: [0, 1, 0],
            orthographic: 0,
        };
        const wideFov: Camera = {
            aspect: 16 / 9,
            fieldOfView: Math.PI / 2, // Wide FOV
            nearPlane: 0.1,
            farPlane: 100,
            position: [0, 0, 5],
            target: [0, 0, 0],
            up: [0, 1, 0],
            orthographic: 0,
        };
        const canvasWidth = 1600;
        const canvasHeight = 900;
        const screenEdge: [number, number] = [canvasWidth, canvasHeight / 2];

        const narrowVP = Camera.toViewProjection(narrowFov);
        const wideVP = Camera.toViewProjection(wideFov);
        const narrowInv = Mat4x4.inverse(narrowVP);
        const wideInv = Mat4x4.inverse(wideVP);

        const narrowRay = Camera.screenToWorldRay(screenEdge, narrowInv, canvasWidth, canvasHeight);
        const wideRay = Camera.screenToWorldRay(screenEdge, wideInv, canvasWidth, canvasHeight);

        // Calculate ray directions
        const narrowDir = [
            narrowRay.b[0] - narrowRay.a[0],
            narrowRay.b[1] - narrowRay.a[1],
            narrowRay.b[2] - narrowRay.a[2]
        ];
        const wideDir = [
            wideRay.b[0] - wideRay.a[0],
            wideRay.b[1] - wideRay.a[1],
            wideRay.b[2] - wideRay.a[2]
        ];

        // Normalize
        const narrowLen = Math.sqrt(narrowDir[0] ** 2 + narrowDir[1] ** 2 + narrowDir[2] ** 2);
        const wideLen = Math.sqrt(wideDir[0] ** 2 + wideDir[1] ** 2 + wideDir[2] ** 2);
        const narrowNorm = [narrowDir[0] / narrowLen, narrowDir[1] / narrowLen, narrowDir[2] / narrowLen];
        const wideNorm = [wideDir[0] / wideLen, wideDir[1] / wideLen, wideDir[2] / wideLen];

        // Wide FOV should have larger angle from center
        const narrowAngle = Math.abs(narrowNorm[0]);
        const wideAngle = Math.abs(wideNorm[0]);
        expect(wideAngle).toBeGreaterThan(narrowAngle);
    });

    it("works with different canvas sizes", () => {
        const camera = createTestCamera();
        const viewProjection = Camera.toViewProjection(camera);
        const invViewProjection = Mat4x4.inverse(viewProjection);

        // Same relative position (center) but different canvas sizes
        const ray1 = Camera.screenToWorldRay([800, 450], invViewProjection, 1600, 900);
        const ray2 = Camera.screenToWorldRay([400, 225], invViewProjection, 800, 450);

        // Should produce approximately the same ray direction
        const dir1 = [ray1.b[0] - ray1.a[0], ray1.b[1] - ray1.a[1], ray1.b[2] - ray1.a[2]];
        const dir2 = [ray2.b[0] - ray2.a[0], ray2.b[1] - ray2.a[1], ray2.b[2] - ray2.a[2]];

        const len1 = Math.sqrt(dir1[0] ** 2 + dir1[1] ** 2 + dir1[2] ** 2);
        const len2 = Math.sqrt(dir2[0] ** 2 + dir2[1] ** 2 + dir2[2] ** 2);

        const norm1 = [dir1[0] / len1, dir1[1] / len1, dir1[2] / len1];
        const norm2 = [dir2[0] / len2, dir2[1] / len2, dir2[2] / len2];

        expect(norm1[0]).toBeCloseTo(norm2[0], 4);
        expect(norm1[1]).toBeCloseTo(norm2[1], 4);
        expect(norm1[2]).toBeCloseTo(norm2[2], 4);
    });

    it("ray has default length of 1000", () => {
        const camera = createTestCamera();
        const canvasWidth = 1600;
        const canvasHeight = 900;
        const screenCenter: [number, number] = [canvasWidth / 2, canvasHeight / 2];

        const viewProjection = Camera.toViewProjection(camera);
        const invViewProjection = Mat4x4.inverse(viewProjection);

        const ray = Camera.screenToWorldRay(screenCenter, invViewProjection, canvasWidth, canvasHeight);

        const rayLength = Math.sqrt(
            (ray.b[0] - ray.a[0]) ** 2 +
            (ray.b[1] - ray.a[1]) ** 2 +
            (ray.b[2] - ray.a[2]) ** 2
        );

        expect(rayLength).toBeCloseTo(1000, 1);
    });

    it("handles extreme screen positions", () => {
        const camera = createTestCamera();
        const canvasWidth = 1600;
        const canvasHeight = 900;
        const viewProjection = Camera.toViewProjection(camera);
        const invViewProjection = Mat4x4.inverse(viewProjection);

        // Test corners and edges
        const positions: Array<[number, number]> = [
            [0, 0],                           // Top-left
            [canvasWidth, 0],                 // Top-right
            [0, canvasHeight],                // Bottom-left
            [canvasWidth, canvasHeight],      // Bottom-right
            [canvasWidth / 2, 0],             // Top-center
            [canvasWidth / 2, canvasHeight],  // Bottom-center
            [0, canvasHeight / 2],            // Left-center
            [canvasWidth, canvasHeight / 2],  // Right-center
        ];

        for (const pos of positions) {
            const ray = Camera.screenToWorldRay(pos, invViewProjection, canvasWidth, canvasHeight);
            
            // Ray should be valid (not NaN or Infinity)
            expect(Number.isFinite(ray.a[0])).toBe(true);
            expect(Number.isFinite(ray.a[1])).toBe(true);
            expect(Number.isFinite(ray.a[2])).toBe(true);
            expect(Number.isFinite(ray.b[0])).toBe(true);
            expect(Number.isFinite(ray.b[1])).toBe(true);
            expect(Number.isFinite(ray.b[2])).toBe(true);
            
            // Ray should have reasonable values
            expect(Math.abs(ray.a[0])).toBeLessThan(1000);
            expect(Math.abs(ray.a[1])).toBeLessThan(1000);
            expect(Math.abs(ray.a[2])).toBeLessThan(1000);
            expect(Math.abs(ray.b[0])).toBeLessThan(2000);
            expect(Math.abs(ray.b[1])).toBeLessThan(2000);
            expect(Math.abs(ray.b[2])).toBeLessThan(2000);
        }
    });

    it("ray direction is normalized correctly", () => {
        const camera = createTestCamera();
        const canvasWidth = 1600;
        const canvasHeight = 900;
        const screenPos: [number, number] = [400, 300];

        const viewProjection = Camera.toViewProjection(camera);
        const invViewProjection = Mat4x4.inverse(viewProjection);

        const ray = Camera.screenToWorldRay(screenPos, invViewProjection, canvasWidth, canvasHeight, 500);

        // Calculate the actual direction
        const dir = [
            ray.b[0] - ray.a[0],
            ray.b[1] - ray.a[1],
            ray.b[2] - ray.a[2]
        ];
        const length = Math.sqrt(dir[0] ** 2 + dir[1] ** 2 + dir[2] ** 2);

        // Length should match the requested length
        expect(length).toBeCloseTo(500, 1);

        // Direction should be properly normalized if we divide by length
        const normalized = [dir[0] / length, dir[1] / length, dir[2] / length];
        const normalizedLength = Math.sqrt(
            normalized[0] ** 2 + normalized[1] ** 2 + normalized[2] ** 2
        );
        expect(normalizedLength).toBeCloseTo(1.0, 6);
    });
}); 