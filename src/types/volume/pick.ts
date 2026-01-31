import { Line3, Vec3 } from "@adobe/data/math";
import type { AabbFace } from "@adobe/data/math/aabb/face/index";
import type { Volume } from "./volume.js";
import * as DenseVolumeNamespace from "../dense-volume/public.js";
import * as ColumnVolumeNamespace from "../column-volume/public.js";
import * as DenseVolumeIs from "../dense-volume/is.js";
import * as ColumnVolumeIs from "../column-volume/is.js";

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
): { coordinates: Vec3; alpha: number; face: AabbFace } | null => {
    if (DenseVolumeIs.is(volume)) {
        return DenseVolumeNamespace.pick(volume, line, pickable);
    }
    
    if (ColumnVolumeIs.is(volume)) {
        return ColumnVolumeNamespace.pick(volume, line, pickable);
    }
    
    // TypeScript exhaustiveness check - this should never happen
    const _exhaustive: never = volume;
    throw new Error(`Unknown volume type: ${(_exhaustive as any).type}`);
};

