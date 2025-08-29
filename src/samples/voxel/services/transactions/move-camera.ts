import { VoxelStore } from "../voxel-store.js";
import * as VEC3 from "math/vec3/index.js";

export interface CameraMovement {
    forward?: number;
    right?: number;
    up?: number;
    pitch?: number;
    yaw?: number;
    roll?: number;
}

export const moveCamera = (t: VoxelStore, movement: CameraMovement) => {
    const { camera } = t.resources;
    
    // Calculate basis vectors
    const forwardVector = VEC3.normalize(VEC3.subtract(camera.target, camera.position));
    let upVector = VEC3.normalize(camera.up);
    let rightVector = VEC3.normalize(VEC3.cross(forwardVector, upVector));
    
    let forward = forwardVector;
    let up = upVector;
    let right = rightVector;
    
    // Apply rotations
    if (movement.pitch) {
        const cosine = Math.cos(movement.pitch), sine = Math.sin(movement.pitch);
        forward = VEC3.add(
            VEC3.scale(forward, cosine),
            VEC3.scale(up, sine)
        );
        up = VEC3.normalize(VEC3.cross(right, forward));
    }
    
    if (movement.yaw) {
        const cosine = Math.cos(movement.yaw), sine = Math.sin(movement.yaw);
        forward = [
            forward[0] * cosine - forward[1] * sine,
            forward[0] * sine + forward[1] * cosine,
            forward[2]
        ];
        up = [
            up[0] * cosine - up[1] * sine,
            up[0] * sine + up[1] * cosine,
            up[2]
        ];
        right = VEC3.normalize(VEC3.cross(forward, up));
    }
    
    if (movement.roll) {
        const cosine = Math.cos(movement.roll), sine = Math.sin(movement.roll);
        up = VEC3.add(
            VEC3.scale(up, cosine),
            VEC3.scale(right, sine)
        );
        right = VEC3.normalize(VEC3.cross(forward, up));
    }
    
    // Apply translation
    let newPosition = camera.position;
    if (movement.forward || movement.right || movement.up) {
        const translation = VEC3.add(
            VEC3.add(
                movement.right ? VEC3.scale(right, movement.right) : [0, 0, 0],
                movement.up ? VEC3.scale(up, movement.up) : [0, 0, 0]
            ),
            movement.forward ? VEC3.scale(forward, movement.forward) : [0, 0, 0]
        );
        newPosition = VEC3.add(camera.position, translation);
    }
    
    // Update camera
    t.resources.camera = {
        ...camera,
        position: newPosition,
        target: VEC3.add(newPosition, forward),
        up
    };
}; 