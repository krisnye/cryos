import { VoxelStore } from "../voxel-store.js";
import { SELECTED_MASK } from "../../types/flags.js";

/**
 * Clears the selection mask from all particle flags
 * This removes selection highlighting from all faces of all particles
 */
export const clearSelection = (t: VoxelStore) => {
    for (const archetype of t.queryArchetypes(["flags"])) {
        const flagsColumn = archetype.columns.flags;
        const entitiesColumn = archetype.columns.id;
        const rowCount = archetype.rowCount;
        for (let i = 0; i < rowCount; i++) {
            const flags = flagsColumn.get(i);
            if (flags & SELECTED_MASK) {
                const newFlags = flags & ~SELECTED_MASK;
                const id = entitiesColumn.get(i);
                t.update(id, { flags: newFlags });
            }
        }
    }
}; 