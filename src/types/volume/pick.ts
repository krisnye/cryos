import { Line3, Vec3, type Aabb } from "@adobe/data/math";
import { Volume } from "./volume.js";
import { DenseVolume } from "../dense-volume/dense-volume.js";
import { ColumnVolume } from "../column-volume/column-volume.js";

/**
 * Picks a voxel from a volume along a line.
 * Dispatches to the appropriate implementation based on volume type.
 * 
 * @param volume The volume to pick from (DenseVolume or ColumnVolume)
 * @param line The line to pick along
 * @param pickable Function that returns true if a voxel should be picked
 * @returns The pick result with voxel coordinates, alpha, and face hit, or null if no voxel is picked.
 */
export const pick = <T>(
    volume: Volume<T>,
    line: Line3,
    pickable: (voxel: T) => boolean
): { coordinates: Vec3; alpha: number; face: Aabb.Face } | null => {
    if (DenseVolume.is(volume)) {
        return DenseVolume.pick(volume, line, pickable);
    }
    
    if (ColumnVolume.is(volume)) {
        return ColumnVolume.pick(volume, line, pickable);
    }
    
    // TypeScript exhaustiveness check - this should never happen
    const _exhaustive: never = volume;
    throw new Error(`Unknown volume type: ${(_exhaustive as any).type}`);
};

