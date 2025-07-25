import { Entity } from "@adobe/data/ecs";
import { Vec3 } from "math/vec3/vec3.js";

// Returns the entity and the picked position (Vec3) or null if not found

export interface PickResult {
    entity: Entity;
    position: Vec3;
}
