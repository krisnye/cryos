import { Vec3, Vec4 } from "@adobe/data/math";
import { schema } from "../voxel-editor-store.js";
import { getCheckerboardPattern } from "./get-checkerboard-pattern.js";

/**
 * Applies a checkerboard pattern to walls in the extended region beyond the default model size.
 * Returns the original color if within default bounds, or a checkerboard variant if in extended region.
 */
export const applyCheckerboardColor = (position: Vec3, baseColor: Vec4, currentSize: Vec3): Vec4 => {
    const defaultSize = schema.resources.modelSize.default;
    
    // Check if this wall is in the extended region (beyond default size but within current size)
    // A wall is in the extended region if ANY of its coordinates are positioned
    // beyond the default bounds in that specific dimension
    const inExtendedRegion = 
        position[0] >= defaultSize[0] ||
        position[1] >= defaultSize[1] ||
        position[2] >= defaultSize[2];
    
    let color = baseColor;
    
    if (inExtendedRegion) {
        // Apply subtle checkerboard pattern: alternate between darker and brighter with slight blue tint
        const isLight = getCheckerboardPattern(position);
        const multiplier: Vec4 = isLight ? [1.0, 1.0, 1.1, 1.0] : [0.5, 0.5, 0.5, 1.0];
        color = Vec4.multiply(baseColor, multiplier);
    }
    
    return color;
};

