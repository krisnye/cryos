import { Entity } from "@adobe/data/ecs";
import { Vec3 } from "math/vec3/vec3.js";

// Returns the entity, picked position (Vec3), and face index (0-5 for cubes) or null if not found

export interface PickResult {
    entity: Entity;
    position: Vec3;
    face: number; // 0-5: POS_Z, POS_X, NEG_Z, NEG_X, POS_Y, NEG_Y (matches flags.ts)
}
