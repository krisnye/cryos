import { SystemFactory } from "systems/system-factory.js";
import { GraphicsService } from "graphics/graphics-service.js";
import { Camera } from "graphics/camera/camera.js";
import { Vec3, Mat4x4 } from "@adobe/data/math";
import { GraphicsStore } from "graphics/database/graphics-store.js";
import { KeyState } from "ui/types/input-state.js";
import { KeyCode } from "ui/types/key-code.js";
import { Entity } from "@adobe/data/ecs";

/**
 * Camera control system that handles input for different camera control types.
 * Currently supports: orbit camera controls.
 */
export const cameraControlSystem: SystemFactory<GraphicsService> = (service) => {
    const { store } = service;

    return [{
        name: "cameraControlSystem",
        phase: "update",
        run: () => {
            const activeViewportId = store.resources.activeViewport;
            if (!activeViewportId) return;

            const viewport = store.read(activeViewportId, store.archetypes.Viewport);
            if (!viewport) return;

            const { camera, cameraControlType } = viewport;
            const { pressedKeys } = store.resources;

            // Route to appropriate camera controller
            switch (cameraControlType) {
                case "orbit":
                    handleOrbitCamera(store, activeViewportId, camera, pressedKeys);
                    break;
                case "free":
                case "first-person":
                case "third-person":
                case "top-down":
                    // Not implemented yet
                    break;
            }
        },
    }];
};

/**
 * Calculate accelerated speed based on how long a key has been held.
 * Speed increases smoothly from base to max over the ramp-up period.
 */
function getAcceleratedSpeed(
    baseSpeed: number,
    maxSpeed: number,
    frameCount: number,
    rampUpFrames: number = 60
): number {
    if (frameCount >= rampUpFrames) {
        return maxSpeed;
    }
    // Smooth ease-in curve (quadratic)
    const t = frameCount / rampUpFrames;
    const easedT = t * t;
    return baseSpeed + (maxSpeed - baseSpeed) * easedT;
}

/**
 * Orbit camera controller
 * - Arrow keys: Rotate camera around target
 * - W/A/S/D: Pan camera and target
 * - Q/E: Zoom in/out
 */
function handleOrbitCamera(
    store: GraphicsStore,
    viewportId: Entity,
    camera: Camera,
    pressedKeys: Partial<Record<KeyCode, KeyState>>
) {
    let newCamera = { ...camera };
    let cameraChanged = false;

    // Get camera forward/right/up vectors for movement
    const forward = Vec3.normalize(Vec3.subtract(camera.target, camera.position));
    const right = Vec3.normalize(Vec3.cross(forward, camera.up));
    const up = Vec3.normalize(Vec3.cross(right, forward));

    // Base speeds (initial speed when key is first pressed)
    const basePanSpeed = 0.05;
    const baseZoomSpeed = 0.1;
    const baseRotationSpeed = 0.02;
    
    // Max speeds (speed after holding key for rampUpFrames)
    const maxPanSpeed = 1.0;
    const maxZoomSpeed = 2.0;
    const maxRotationSpeed = 0.08;
    
    // Frames to reach max speed for different controls
    const panZoomRampUpFrames = 30;  // 0.5 seconds at 60fps - faster acceleration for pan/zoom
    const rotationRampUpFrames = 60; // 1 second at 60fps - slower, more precise for rotation

    // Handle keyboard input for pan (WASD)
    if (pressedKeys.KeyW) {
        const speed = getAcceleratedSpeed(basePanSpeed, maxPanSpeed, pressedKeys.KeyW.frameCount, panZoomRampUpFrames);
        const panOffset = Vec3.scale(up, speed);
        newCamera.position = Vec3.add(newCamera.position, panOffset);
        newCamera.target = Vec3.add(newCamera.target, panOffset);
        cameraChanged = true;
    }
    if (pressedKeys.KeyS) {
        const speed = getAcceleratedSpeed(basePanSpeed, maxPanSpeed, pressedKeys.KeyS.frameCount, panZoomRampUpFrames);
        const panOffset = Vec3.scale(up, -speed);
        newCamera.position = Vec3.add(newCamera.position, panOffset);
        newCamera.target = Vec3.add(newCamera.target, panOffset);
        cameraChanged = true;
    }
    if (pressedKeys.KeyA) {
        const speed = getAcceleratedSpeed(basePanSpeed, maxPanSpeed, pressedKeys.KeyA.frameCount, panZoomRampUpFrames);
        const panOffset = Vec3.scale(right, -speed);
        newCamera.position = Vec3.add(newCamera.position, panOffset);
        newCamera.target = Vec3.add(newCamera.target, panOffset);
        cameraChanged = true;
    }
    if (pressedKeys.KeyD) {
        const speed = getAcceleratedSpeed(basePanSpeed, maxPanSpeed, pressedKeys.KeyD.frameCount, panZoomRampUpFrames);
        const panOffset = Vec3.scale(right, speed);
        newCamera.position = Vec3.add(newCamera.position, panOffset);
        newCamera.target = Vec3.add(newCamera.target, panOffset);
        cameraChanged = true;
    }

    // Handle keyboard input for zoom (Q/E)
    if (pressedKeys.KeyQ) {
        // Zoom out - move position away from target
        const speed = getAcceleratedSpeed(baseZoomSpeed, maxZoomSpeed, pressedKeys.KeyQ.frameCount, panZoomRampUpFrames);
        const distance = Vec3.distance(newCamera.position, newCamera.target);
        const newDistance = distance + speed;
        const direction = Vec3.normalize(Vec3.subtract(newCamera.position, newCamera.target));
        newCamera.position = Vec3.add(newCamera.target, Vec3.scale(direction, newDistance));
        cameraChanged = true;
    }
    if (pressedKeys.KeyE) {
        // Zoom in - move position toward target
        const speed = getAcceleratedSpeed(baseZoomSpeed, maxZoomSpeed, pressedKeys.KeyE.frameCount, panZoomRampUpFrames);
        const distance = Vec3.distance(newCamera.position, newCamera.target);
        const newDistance = Math.max(camera.nearPlane * 2, distance - speed);
        const direction = Vec3.normalize(Vec3.subtract(newCamera.position, newCamera.target));
        newCamera.position = Vec3.add(newCamera.target, Vec3.scale(direction, newDistance));
        cameraChanged = true;
    }

    // Handle arrow keys for orbit rotation
    const worldUp: Vec3 = [0, 0, 1]; // Z is up
    
    // Arrow Left/Right: Rotate horizontally around target (around world Z axis)
    if (pressedKeys.ArrowLeft) {
        const speed = getAcceleratedSpeed(baseRotationSpeed, maxRotationSpeed, pressedKeys.ArrowLeft.frameCount, rotationRampUpFrames);
        const offset = Vec3.subtract(newCamera.position, newCamera.target);
        const rotationZ = Mat4x4.rotationZ(speed);
        const rotatedOffset = Mat4x4.multiplyVec3(rotationZ, offset);
        newCamera.position = Vec3.add(newCamera.target, rotatedOffset);
        
        // Update up vector to stay perpendicular to view direction
        const newForward = Vec3.normalize(Vec3.subtract(newCamera.target, newCamera.position));
        const newRight = Vec3.normalize(Vec3.cross(newForward, worldUp));
        newCamera.up = Vec3.normalize(Vec3.cross(newRight, newForward));
        
        cameraChanged = true;
    }
    if (pressedKeys.ArrowRight) {
        const speed = getAcceleratedSpeed(baseRotationSpeed, maxRotationSpeed, pressedKeys.ArrowRight.frameCount, rotationRampUpFrames);
        const offset = Vec3.subtract(newCamera.position, newCamera.target);
        const rotationZ = Mat4x4.rotationZ(-speed);
        const rotatedOffset = Mat4x4.multiplyVec3(rotationZ, offset);
        newCamera.position = Vec3.add(newCamera.target, rotatedOffset);
        
        // Update up vector to stay perpendicular to view direction
        const newForward = Vec3.normalize(Vec3.subtract(newCamera.target, newCamera.position));
        const newRight = Vec3.normalize(Vec3.cross(newForward, worldUp));
        newCamera.up = Vec3.normalize(Vec3.cross(newRight, newForward));
        
        cameraChanged = true;
    }

    // Arrow Up/Down: Rotate vertically around target (around local right axis)
    // Use the camera's current up vector to maintain continuity through zenith/nadir
    const handleVerticalRotation = (angle: number) => {
        const offset = Vec3.subtract(newCamera.position, newCamera.target);
        const currentForward = Vec3.normalize(Vec3.negate(offset));
        
        // Calculate right vector using camera's current up vector (not world up)
        // This maintains continuity when rotating through straight up/down
        const currentRight = Vec3.normalize(Vec3.cross(currentForward, newCamera.up));
        
        // Create rotation matrix around right axis using Rodrigues' formula
        const c = Math.cos(angle);
        const s = Math.sin(angle);
        const t = 1 - c;
        const [rx, ry, rz] = currentRight;
        
        const rotationMatrix: Mat4x4 = [
            t * rx * rx + c,     t * rx * ry + s * rz, t * rx * rz - s * ry, 0,
            t * rx * ry - s * rz, t * ry * ry + c,     t * ry * rz + s * rx, 0,
            t * rx * rz + s * ry, t * ry * rz - s * rx, t * rz * rz + c,     0,
            0,                   0,                   0,                   1
        ];
        
        // Rotate both the position offset and the up vector
        const rotatedOffset = Mat4x4.multiplyVec3(rotationMatrix, offset);
        const rotatedUp = Mat4x4.multiplyVec3(rotationMatrix, newCamera.up);
        
        newCamera.position = Vec3.add(newCamera.target, rotatedOffset);
        newCamera.up = Vec3.normalize(rotatedUp);
        
        cameraChanged = true;
    };

    if (pressedKeys.ArrowUp) {
        const speed = getAcceleratedSpeed(baseRotationSpeed, maxRotationSpeed, pressedKeys.ArrowUp.frameCount, rotationRampUpFrames);
        handleVerticalRotation(speed);
    }
    if (pressedKeys.ArrowDown) {
        const speed = getAcceleratedSpeed(baseRotationSpeed, maxRotationSpeed, pressedKeys.ArrowDown.frameCount, rotationRampUpFrames);
        handleVerticalRotation(-speed);
    }

    // Update camera if it changed
    if (cameraChanged) {
        store.update(viewportId, { camera: newCamera });
    }
}

