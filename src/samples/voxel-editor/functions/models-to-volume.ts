import { Vec3 } from "@adobe/data/math";
import { createTypedBuffer } from "@adobe/data/typed-buffer";
import { Volume } from "data/index.js";
import { MaterialIndex } from "physics/material.js";
import { materials } from "physics/basic-materials.js";
import { VoxelEditorStore } from "../voxel-editor-store.js";

/**
 * Result of converting models to volume, including workspace info
 */
export type ModelsToVolumeResult = {
    modelSize: Vec3;
    material: Volume<MaterialIndex>;
    offset: Vec3; // Integer position of packed volume's min corner
};

/**
 * Converts Model entities from the store into a compact Volume<MaterialIndex>.
 * Determines tight bounding box around all voxels and packs them into a volume.
 * Returns the packed volume along with workspace size and offset.
 */
export const modelsToVolume = (store: VoxelEditorStore): ModelsToVolumeResult => {
    // Collect all model positions and materials
    const voxels: Array<{ position: Vec3; material: MaterialIndex }> = [];
    
    for (const table of store.queryArchetypes(store.archetypes.Model.components)) {
        for (let i = 0; i < table.rowCount; i++) {
            const position = table.columns.position.get(i);
            const material = table.columns.material.get(i);
            voxels.push({ position, material });
        }
    }
    
    // Get workspace size from store
    const modelSize = store.resources.modelSize;
    
    // Handle empty case - return minimal volume with air
    if (voxels.length === 0) {
        const data = createTypedBuffer(MaterialIndex.schema, 1);
        data.set(0, materials.air.index);
        return { 
            modelSize,
            material: { size: [1, 1, 1], data },
            offset: [0, 0, 0]
        };
    }
    
    // Find bounding box
    let minX = Infinity, minY = Infinity, minZ = Infinity;
    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
    
    for (const { position } of voxels) {
        const [x, y, z] = position;
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        minZ = Math.min(minZ, z);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
        maxZ = Math.max(maxZ, z);
    }
    
    // Calculate size (inclusive of max positions)
    const width = maxX - minX + 1;
    const height = maxY - minY + 1;
    const depth = maxZ - minZ + 1;
    const size: Vec3 = [width, height, depth];
    
    // Create volume buffer and fill with air
    const capacity = width * height * depth;
    const data = createTypedBuffer(MaterialIndex.schema, capacity);
    for (let i = 0; i < capacity; i++) {
        data.set(i, materials.air.index);
    }
    
    // Fill in voxel materials at correct positions
    for (const { position, material } of voxels) {
        const [x, y, z] = position;
        // Convert world position to volume-relative position
        const relX = x - minX;
        const relY = y - minY;
        const relZ = z - minZ;
        // Calculate flat index
        const index = relX + width * (relY + relZ * height);
        data.set(index, material);
    }
    
    return {
        modelSize,
        material: { size, data },
        offset: [minX, minY, minZ]
    };
};

