import { System } from "graphics/systems/system.js";
import { MainService } from "../create-main-service.js";
import * as VEC3 from "math/vec3/index.js";

export const cameraControlSystem = ({ store }: MainService): System => {
  const SPEED  = 10; // units · s⁻¹
  const PITCH  = 2;  // rad  · s⁻¹
  const ROLL   = 2;  // rad  · s⁻¹

  return {
    name: "cameraControlSystem",
    phase: "update",
    run: () => {
      const { deltaTime }               = store.resources.updateFrame;
      const { pressedKeys, camera }     = store.resources;

      /* ---------- basis vectors ---------- */
      let forward = VEC3.normalize(VEC3.subtract(camera.target, camera.position));
      let   up    = VEC3.normalize(camera.up);
      let   right = VEC3.normalize(VEC3.cross(forward, up));

      /* ---------- R / F pitch (look up / down) ---------- */
      let pitch = 0;
      if (pressedKeys.KeyR) pitch += PITCH * deltaTime; // look up
      if (pressedKeys.KeyF) pitch -= PITCH * deltaTime; // look down

      if (pitch) {
        // rotate forward + up around right axis
        const c = Math.cos(pitch), s = Math.sin(pitch);
        forward = VEC3.add(
          VEC3.scale(forward, c),
          VEC3.scale(up,      s)
        );
        up = VEC3.normalize(VEC3.cross(right, forward)); // keep orthogonal
      }

      /* ---------- Q / E roll (rotate around forward) ---------- */
      let roll = 0;
      if (pressedKeys.KeyQ) roll -= ROLL * deltaTime; // roll right
      if (pressedKeys.KeyE) roll += ROLL * deltaTime; // roll left

      if (roll) {
        // rotate up + right around forward axis
        const c = Math.cos(roll), s = Math.sin(roll);
        up = VEC3.add(
          VEC3.scale(up,    c),
          VEC3.scale(right, s)
        );
        right = VEC3.normalize(VEC3.cross(forward, up)); // keep orthogonal
      }

      /* ---------- WASD translation ---------- */
      const dx = (pressedKeys.KeyD ? 1 : 0) - (pressedKeys.KeyA ? 1 : 0); // ±right
      const dy = (pressedKeys.KeyW ? 1 : 0) - (pressedKeys.KeyS ? 1 : 0); // ±up
      const dz = (pressedKeys.ArrowUp ? 1 : 0) - (pressedKeys.ArrowDown ? 1 : 0); // ±forward (zoom)

      const len = Math.hypot(dx, dy, dz);
      const step = len ? (SPEED * deltaTime) / len : 0;

      const move = VEC3.add(
        VEC3.add(
          VEC3.scale(right,  dx * step),
          VEC3.scale(up,     dy * step)
        ),
        VEC3.scale(forward, dz * step)
      );

      const position = VEC3.add(camera.position, move);
      const target =   VEC3.add(VEC3.add(camera.position, move), forward); // new position + forward

      /* ---------- commit ---------- */
      store.resources.camera = {
        ...camera,
        position,
        target,
        up
      };
    }
  };
};
