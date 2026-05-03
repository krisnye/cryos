import { Vec3 } from "@adobe/data/math";

/**
 * Required state for one colliding body.
 * Units:
 * - volumeM3: m^3
 * - velocity: m/s
 * - health: normalized durability state in [0, 1]
 */
export interface MaterialCollisionBody {
    materialId: number;
    volumeM3: number;
    velocity: Vec3;
    health: number;
}
