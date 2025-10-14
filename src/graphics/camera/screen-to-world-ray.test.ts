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
}); 