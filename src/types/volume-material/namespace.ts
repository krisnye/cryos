import type { VolumeMaterial } from "./volume-material.js";
import { Material } from "../index.js";
import { MaterialId } from "../material/material-id.js";
import * as Volume from "../volume/namespace.js";

/**
 * Material type flags:
 * - NEITHER = neither opaque nor transparent (all air/empty)
 * - OPAQUE_ONLY = opaque only
 * - TRANSPARENT_ONLY = transparent only
 * - BOTH = both opaque and transparent
 */
export const VisibilityType = {
    NEITHER: 0,
    OPAQUE_ONLY: 1,
    TRANSPARENT_ONLY: 2,
    BOTH: 3,
} as const;

export type VisibilityType = typeof VisibilityType[keyof typeof VisibilityType];

/**
 * Memoization cache for checkMaterialTypes results.
 * Uses WeakMap keyed by volume identity for automatic garbage collection.
 */
const materialTypesCache = new WeakMap<VolumeMaterial, VisibilityType>();

/**
 * Module-level material transparency cache.
 * Rebuilt when Material.materials array changes (length changes).
 */
let materialTransparentCache: boolean[] = [];
let materialCacheLength = 0;

/**
 * Rebuild the material transparency cache if Material.materials has changed.
 */
function updateMaterialTransparentCache(): void {
    if (Material.materials.length !== materialCacheLength) {
        materialTransparentCache.length = Material.materials.length;
        for (let i = 0; i < Material.materials.length; i++) {
            materialTransparentCache[i] = Material.materials[i].baseColor[3] < 1.0;
        }
        materialCacheLength = Material.materials.length;
    }
}

/**
 * Check if a volume contains opaque and/or transparent materials.
 * Returns a MaterialType: NEITHER, OPAQUE_ONLY, TRANSPARENT_ONLY, or BOTH.
 * Results are memoized using a WeakMap keyed by volume identity.
 */
export function checkMaterialTypes(volume: VolumeMaterial): VisibilityType {
    // Check cache first
    const cached = materialTypesCache.get(volume);
    if (cached !== undefined) {
        return cached;
    }

    // Update material transparency cache if needed
    updateMaterialTransparentCache();

    let hasOpaque = false;
    let hasTransparent = false;

    const [width, height, depth] = volume.size;

    // Check all voxels for opaque and transparent materials
    // Early exit if we've found both
    for (let z = 0; z < depth && !(hasOpaque && hasTransparent); z++) {
        for (let y = 0; y < height && !(hasOpaque && hasTransparent); y++) {
            for (let x = 0; x < width && !(hasOpaque && hasTransparent); x++) {
                const voxelIndex = Volume.index<MaterialId>(volume, x, y, z);
                const materialId = volume.data.get(voxelIndex);

                // Skip empty/air (materialId === 0)
                if (materialId === 0) continue;

                // Check if material is transparent
                if (materialTransparentCache[materialId]) {
                    hasTransparent = true;
                } else {
                    hasOpaque = true;
                }
            }
        }
    }

    // Determine result based on flags found
    const result: VisibilityType = 
        !hasOpaque && !hasTransparent ? VisibilityType.NEITHER :
        hasOpaque && !hasTransparent ? VisibilityType.OPAQUE_ONLY :
        !hasOpaque && hasTransparent ? VisibilityType.TRANSPARENT_ONLY :
        VisibilityType.BOTH; // hasOpaque && hasTransparent

    // Cache and return result
    materialTypesCache.set(volume, result);
    return result;
}

