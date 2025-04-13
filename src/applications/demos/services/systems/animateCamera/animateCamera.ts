import { StateService } from "../../StateService";
import { Systems } from "../Systems";
import { Vec3_cross, Vec3_normalize, Vec3_subtract } from "../../../../../data/Vec3/functions";

const CAMERA_SPEED = 10.0;
const ROTATION_SPEED = 2.0;
const ZOOM_SPEED = 15.0;

export const createAnimateCamera = (db: StateService): Systems => {
    return {
        name: "animateCamera",
        update(commandEncoder: GPUCommandEncoder) {
            const { camera, pressedKeys, deltaTime } = db.resources;
            
            // Movement
            if (pressedKeys.has("w")) {
                camera.position[1] += CAMERA_SPEED * deltaTime;  // forward
                camera.target[1] += CAMERA_SPEED * deltaTime;
            }
            if (pressedKeys.has("s")) {
                camera.position[1] -= CAMERA_SPEED * deltaTime;  // backward
                camera.target[1] -= CAMERA_SPEED * deltaTime;
            }
            if (pressedKeys.has("a")) {
                camera.position[0] -= CAMERA_SPEED * deltaTime;  // left
                camera.target[0] -= CAMERA_SPEED * deltaTime;
            }
            if (pressedKeys.has("d")) {
                camera.position[0] += CAMERA_SPEED * deltaTime;  // right
                camera.target[0] += CAMERA_SPEED * deltaTime;
            }

            // Rotation - rotate up vector around look direction
            if (pressedKeys.has("q") || pressedKeys.has("e")) {
                // Calculate look direction (from position to target)
                const lookDir = Vec3_normalize(Vec3_subtract(camera.target, camera.position));
                
                // Calculate rotation angle
                const angle = (pressedKeys.has("q") ? -1 : 1) * ROTATION_SPEED * deltaTime;
                
                // Rotate up vector using Rodrigues rotation formula
                const cos = Math.cos(angle);
                const sin = Math.sin(angle);
                const cross = Vec3_cross(lookDir, camera.up);
                
                // Apply rotation: v' = v*cos + (k×v)*sin
                const x = camera.up[0] * cos + cross[0] * sin;
                const y = camera.up[1] * cos + cross[1] * sin;
                const z = camera.up[2] * cos + cross[2] * sin;
                
                // Normalize and update
                const len = Math.sqrt(x * x + y * y + z * z);
                camera.up[0] = x / len;
                camera.up[1] = y / len;
                camera.up[2] = z / len;
            }

            // Zoom
            if (pressedKeys.has("ArrowUp")) {
                camera.position[2] -= ZOOM_SPEED * deltaTime;
            }
            if (pressedKeys.has("ArrowDown")) {
                camera.position[2] += ZOOM_SPEED * deltaTime;
            }
        }
    }
};