import { Vec3, Quat } from "@adobe/data/math";
import { Volume } from "data/index.js";
import { MaterialIndex } from "physics/material.js";
import { materials } from "physics/basic-materials.js";
import { VoxelEditorStore } from "../voxel-editor-store.js";

/**
 * Converts a Volume<MaterialIndex> into Model entities in the store.
 * Skips air voxels and sets appropriate material colors.
 * 
 * @param store - The voxel editor store to insert entities into
 * @param volume - The volume containing material indices
 * @param offset - World position offset for the volume origin
 */
export const volumeToModels = (
    store: VoxelEditorStore,
    volume: Volume<MaterialIndex>,
    offset: Vec3
): void => {
    const [width, height, depth] = volume.size;
    
    // Iterate through all volume positions
    for (let z = 0; z < depth; z++) {
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                // Get material index at this position
                const index = Volume.index(volume, x, y, z);
                const materialIndex = volume.data.get(index);
                
                // Skip air voxels
                if (materialIndex === materials.air.index) {
                    continue;
                }
                
                // Calculate world position
                const position: Vec3 = [
                    offset[0] + x,
                    offset[1] + y,
                    offset[2] + z
                ];
                
                // Get material color by index (O(1) lookup)
                const material = materials[materialIndex];
                const color = material?.color ?? [1, 1, 1, 1];
                
                // Create Model entity
                store.archetypes.Model.insert({
                    model: true,
                    pickable: true,
                    material: materialIndex,
                    position,
                    color,
                    scale: [1, 1, 1],
                    rotation: Quat.identity,
                });
            }
        }
    }
};

