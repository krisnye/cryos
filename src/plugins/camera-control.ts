import { Database } from "@adobe/data/ecs";
import { Vec3, Mat4x4 } from "@adobe/data/math";
import type { Camera } from "../types/camera/index.js";
import { KeyCode } from "../types/key-code.js";
import { KeyState } from "../types/key-state.js";
import { scene } from "./scene.js";
import { keyInput } from "./key-input.js";

type CameraControlType = "orbit" | "free" | "first-person" | "third-person" | "top-down";

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
 * - R/F: Adjust orthographic blend (R=more ortho, F=more perspective)
 */
function handleOrbitCamera(
    db: Database<any, any, any, any, any>,
    camera: Camera,
    pressedKeys: Partial<Record<KeyCode, KeyState>>
): Camera | null {
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

    // Handle keyboard input for orthographic blend (R/F)
    const orthographicSpeed = 0.02; // Speed to blend between perspective and orthographic
    if (pressedKeys.KeyR) {
        // Increase orthographic (toward orthographic)
        newCamera.orthographic = Math.min(1.0, newCamera.orthographic + orthographicSpeed);
        cameraChanged = true;
    }
    if (pressedKeys.KeyF) {
        // Decrease orthographic (toward perspective)
        newCamera.orthographic = Math.max(0.0, newCamera.orthographic - orthographicSpeed);
        cameraChanged = true;
    }

    // Handle arrow keys for orbit rotation
    const worldUp: Vec3 = [0, 1, 0]; // Y is up (matching default camera convention)
    const worldZAxis: Vec3 = [0, 0, 1]; // World Z axis (vertical)
    
    // Arrow Left/Right: Orbit around target (around world Z axis)
    // This rotates the camera in the XY plane, keeping Z constant
    if (pressedKeys.ArrowLeft) {
        const speed = getAcceleratedSpeed(baseRotationSpeed, maxRotationSpeed, pressedKeys.ArrowLeft.frameCount, rotationRampUpFrames);
        const offset = Vec3.subtract(newCamera.position, newCamera.target);
        
        // Rotate offset around world Z axis using rotationZ matrix
        // This rotates in the XY plane (X and Y change, Z stays constant)
        const rotationZ = Mat4x4.rotationZ(speed);
        const rotatedOffset = Mat4x4.multiplyVec3(rotationZ, offset);
        newCamera.position = Vec3.add(newCamera.target, rotatedOffset);
        
        // Rotate up vector around world Z axis to maintain camera orientation
        const rotatedUp = Mat4x4.multiplyVec3(rotationZ, newCamera.up);
        newCamera.up = Vec3.normalize(rotatedUp);
        
        cameraChanged = true;
    }
    if (pressedKeys.ArrowRight) {
        const speed = getAcceleratedSpeed(baseRotationSpeed, maxRotationSpeed, pressedKeys.ArrowRight.frameCount, rotationRampUpFrames);
        const offset = Vec3.subtract(newCamera.position, newCamera.target);
        
        // Rotate offset around world Z axis using rotationZ matrix
        // This rotates in the XY plane (X and Y change, Z stays constant)
        const rotationZ = Mat4x4.rotationZ(-speed);
        const rotatedOffset = Mat4x4.multiplyVec3(rotationZ, offset);
        newCamera.position = Vec3.add(newCamera.target, rotatedOffset);
        
        // Rotate up vector around world Z axis to maintain camera orientation
        const rotatedUp = Mat4x4.multiplyVec3(rotationZ, newCamera.up);
        newCamera.up = Vec3.normalize(rotatedUp);
        
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

    return cameraChanged ? newCamera : null;
}

export const cameraControl = Database.Plugin.create({
    resources: {
        cameraControlType: { default: null as CameraControlType | null },
    },
    systems: {
        cameraControl: {
            create: (db) => {
                return () => {
                    const { cameraControlType, camera, pressedKeys } = db.store.resources;
                    if (!cameraControlType || !camera) return;

                    // Route to appropriate camera controller
                    let newCamera: Camera | null = null;
                    switch (cameraControlType) {
                        case "orbit":
                            newCamera = handleOrbitCamera(db, camera, pressedKeys);
                            break;
                        case "free":
                        case "first-person":
                        case "third-person":
                        case "top-down":
                            // Not implemented yet
                            break;
                    }

                    // Update camera if it changed
                    if (newCamera) {
                        db.store.resources.camera = newCamera;
                    }
                };
            },
            schedule: { during: ["update"] }
        }
    },
    extends: Database.Plugin.combine(scene, keyInput)
});

