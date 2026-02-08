import { Entity } from "@adobe/data/ecs";
import { Vec3 } from "@adobe/data/math";
import type { AabbFace } from "@adobe/data/math/aabb/face/index";

/**
 * Result of picking an entity (e.g., a volume model).
 * Contains entity information and intersection point.
 *
 * Coordinate semantics:
 * - worldPosition: use directly or derive via Line3.interpolate(line, lineAlpha)
 * - modelPosition: actual point of contact in model space (floats)
 * - modelCoordinates: model-specific; for Volumes, always integer [x,y,z] voxel indices
 */
export interface PickResult {
    /** The entity that was picked. */
    entity: Entity;
    /**
     * Alpha value (0–1) along the picking line where the intersection occurs.
     * Use Line3.interpolate(line, lineAlpha) to derive the world-space hit point if needed.
     */
    lineAlpha: number;
    /**
     * Exact surface hit point in world space (not voxel center).
     * Equivalent to Line3.interpolate(line, lineAlpha) along the pick line.
     */
    worldPosition: Vec3;
    /**
     * Actual point of contact within the model's coordinate space (floats).
     * This is the interpolated hit position in model space, not voxel indices.
     * For Volumes, use modelCoordinates for integer voxel indices.
     */
    modelPosition: Vec3;
    /**
     * Model-space coordinates of the picked element. Interpretation varies by model type.
     * For Volumes: always integer [x,y,z] voxel indices of the picked voxel.
     * Other model types may define this differently.
     */
    modelCoordinates: Vec3;
    /** The AABB face that was hit. */
    face: AabbFace;
    /** Face normal pointing outward from the surface. */
    faceNormal: Vec3;
}
