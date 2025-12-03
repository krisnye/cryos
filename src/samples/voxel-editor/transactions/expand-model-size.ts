import { Vec3 } from "@adobe/data/math";
import { VoxelEditorStore } from "../voxel-editor-store.js";
import { schema } from "../voxel-editor-store.js";
import { setModelSize } from "./set-model-size.js";

/**
 * Adjusts the model size to accommodate all pickable entities (excluding walls).
 * Expands as needed, and shrinks back down to the default size when possible.
 */
export const expandModelSize = (t: VoxelEditorStore): void => {
    const currentSize = t.resources.modelSize;
    const defaultSize = schema.resources.modelSize.default;
    
    // Start with default size as minimum
    let maxX = defaultSize[0];
    let maxY = defaultSize[1];
    let maxZ = defaultSize[2];

    // Find maximum extents from pickable entities (excluding walls)
    for (const table of t.queryArchetypes(t.archetypes.Pickable.components, { exclude: ["wall"] })) {
        for (let i = 0; i < table.rowCount; i++) {
            const position = table.columns.position.get(i);
            // Add 1 to each coordinate because we need to contain the voxel at that position
            maxX = Math.max(maxX, position[0] + 1);
            maxY = Math.max(maxY, position[1] + 1);
            maxZ = Math.max(maxZ, position[2] + 1);
        }
    }

    // Update if size needs to change (expand or shrink)
    if (maxX !== currentSize[0] || maxY !== currentSize[1] || maxZ !== currentSize[2]) {
        const newSize: Vec3 = [maxX, maxY, maxZ];
        setModelSize(t, newSize);
    }
};

