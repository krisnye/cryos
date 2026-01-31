import { Entity } from "@adobe/data/ecs";
import { Vec3 } from "@adobe/data/math";
import type { AabbFace } from "@adobe/data/math/aabb/face/index";

/**
 * Result of picking an entity (e.g., a volume model).
 * Contains entity information and intersection point.
 */
export interface PickResult {
    /** The entity that was picked. */
    entity: Entity;
    /** Alpha value (0-1) along the picking line where the intersection/closest point occurs. */
    lineAlpha: number;
    /** World-space position of the picked entity. */
    worldPosition: Vec3;
    /** Model-space position on the picked entity. */
    modelPosition?: Vec3;
    /** The AABB face that was hit (if available). */
    face?: AabbFace;
}
