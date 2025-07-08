import { System } from "graphics/systems/system.js";
import { MainService } from "../create-main-service.js";
import * as VEC3 from "math/vec3/index.js";

export const cameraControlSystem = ({ store, database }: MainService): System => {
  const baseSpeed = 10; // units per second
  const maximumSpeed = 1500;  // units per second
  const accelerationPerFrame = 0.2; // slower acceleration factor per frame
  const pitchRate = 2;  // radians per second
  const yawRate = 2;    // radians per second
  const rollRate = 2;   // radians per second

  return {
    name: "cameraControlSystem",
    phase: "update",
    run: () => {
      const { deltaTime } = store.resources.updateFrame;
      const { pressedKeys, camera } = store.resources;

      // Basis vectors
      const forwardVector = VEC3.normalize(VEC3.subtract(camera.target, camera.position));
      let upVector = VEC3.normalize(camera.up);
      let rightVector = VEC3.normalize(VEC3.cross(forwardVector, upVector));

      // Pitch (look up/down)
      let pitchAmount = 0;
      if (pressedKeys.KeyR) pitchAmount += pitchRate * deltaTime;
      if (pressedKeys.KeyF) pitchAmount -= pitchRate * deltaTime;

      let forward = forwardVector;
      let up = upVector;
      let right = rightVector;

      if (pitchAmount) {
        const cosine = Math.cos(pitchAmount), sine = Math.sin(pitchAmount);
        forward = VEC3.add(
          VEC3.scale(forward, cosine),
          VEC3.scale(up, sine)
        );
        up = VEC3.normalize(VEC3.cross(right, forward));
      }

      // Yaw (turn left/right) - rotate around world -z axis
      let yawAmount = 0;
      if (pressedKeys.ArrowLeft) yawAmount += yawRate * deltaTime;
      if (pressedKeys.ArrowRight) yawAmount -= yawRate * deltaTime;

      if (yawAmount) {
        const worldZAxis = [0, 0, -1]; // World -z axis
        const cosine = Math.cos(yawAmount), sine = Math.sin(yawAmount);
        
        // Rotate forward vector around world -z axis
        forward = [
          forward[0] * cosine - forward[1] * sine,
          forward[0] * sine + forward[1] * cosine,
          forward[2]
        ];
        
        // Rotate up vector around world -z axis
        up = [
          up[0] * cosine - up[1] * sine,
          up[0] * sine + up[1] * cosine,
          up[2]
        ];
        
        // Recompute right vector to maintain orthogonality
        right = VEC3.normalize(VEC3.cross(forward, up));
      }

      // Roll (rotate around forward)
      let rollAmount = 0;
      if (pressedKeys.KeyQ) rollAmount -= rollRate * deltaTime;
      if (pressedKeys.KeyE) rollAmount += rollRate * deltaTime;

      if (rollAmount) {
        const cosine = Math.cos(rollAmount), sine = Math.sin(rollAmount);
        up = VEC3.add(
          VEC3.scale(up, cosine),
          VEC3.scale(right, sine)
        );
        right = VEC3.normalize(VEC3.cross(forward, up));
      }

      // WASD and arrow translation with acceleration
      const moveRight = (pressedKeys.KeyD ? 1 : 0) - (pressedKeys.KeyA ? 1 : 0);
      const moveUp = (pressedKeys.KeyW ? 1 : 0) - (pressedKeys.KeyS ? 1 : 0);
      const moveForward = (pressedKeys.ArrowUp ? 1 : 0) - (pressedKeys.ArrowDown ? 1 : 0);

      // Compute acceleration factor for each direction
      const getAcceleration = (key: keyof typeof pressedKeys) => {
        const heldFrames = pressedKeys[key] ?? 0;
        // Acceleration grows with time held, capped at maximumSpeed
        return Math.min(1 + heldFrames * accelerationPerFrame, maximumSpeed / baseSpeed);
      };
      const accelerationX = moveRight > 0 ? getAcceleration('KeyD') : moveRight < 0 ? getAcceleration('KeyA') : 1;
      const accelerationY = moveUp > 0 ? getAcceleration('KeyW') : moveUp < 0 ? getAcceleration('KeyS') : 1;
      const accelerationZ = moveForward > 0 ? getAcceleration('ArrowUp') : moveForward < 0 ? getAcceleration('ArrowDown') : 1;

      // Each direction's speed is independent and always increases as you hold the key
      const movement = VEC3.add(
        VEC3.add(
          VEC3.scale(right, moveRight * baseSpeed * accelerationX * deltaTime),
          VEC3.scale(up, moveUp * baseSpeed * accelerationY * deltaTime)
        ),
        VEC3.scale(forward, moveForward * baseSpeed * accelerationZ * deltaTime)
      );

      const newPosition = VEC3.add(camera.position, movement);
      const newTarget = VEC3.add(VEC3.add(camera.position, movement), forward);

      // Commit
      database.transactions.updateCamera({
        position: newPosition,
        target: newTarget,
        up
      });
    }
  };
};
