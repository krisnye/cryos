import { Vec3 } from "@adobe/data/math";
import type { PickResult } from "./pick-result.js";
import { AabbFace } from "@adobe/data/math/aabb/face/index";

/**
 * Result of picking a voxel in a volume.
 * Extends PickResult with required voxel coordinates and face information.
 */
export interface VoxelPickResult extends PickResult {
    /** Voxel coordinates and face of the picked voxel. */
    voxel: {
        coordinates: Vec3;
        face: AabbFace;
    };
}
