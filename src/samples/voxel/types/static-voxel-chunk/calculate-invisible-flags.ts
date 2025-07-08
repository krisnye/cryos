import { VoxelMapChunk } from "./static-voxel-chunk.js";
import { StaticVoxel } from "../static-voxel/static-voxel.js";
import { 
    FRONT_FACE_INVISIBLE,
    RIGHT_FACE_INVISIBLE,
    BACK_FACE_INVISIBLE,
    LEFT_FACE_INVISIBLE,
    TOP_FACE_INVISIBLE,
    BOTTOM_FACE_INVISIBLE,
    ALL_FACES_INVISIBLE_MASK
} from "../static-voxel/static-voxel-flags.js";

/**
 * Checks if a voxel exists at the given coordinates in the chunk
 */
const hasVoxelAt = (chunk: VoxelMapChunk, x: number, y: number, z: number): boolean => {
    // Check bounds
    if (x < 0 || x >= chunk.size || y < 0 || y >= chunk.size || z < 0) {
        return false;
    }
    
    const tileIndex = y * chunk.size + x;
    const tile = chunk.tiles.get(tileIndex);
    
    // If no voxels in this column, return false
    if (tile.dataLength === 0) {
        return false;
    }
    
    // Check if any voxel in this column has the target height
    for (let i = 0; i < tile.dataLength; i++) {
        const voxel = chunk.blocks.get(tile.dataIndex + i);
        if (voxel.height === z) {
            return true;
        }
    }
    
    return false;
};

/**
 * Calculates face invisibility flags for voxels in a static voxel chunk.
 * 
 * Each face of a voxel is marked as invisible if there is an adjacent voxel on that side.
 * The face order corresponds to the indices in particles.wgsl:
 * 1. Front face (indices 0-5) - +Z direction
 * 2. Right face (indices 6-11) - +X direction  
 * 3. Back face (indices 12-17) - -Z direction
 * 4. Left face (indices 18-23) - -X direction
 * 5. Top face (indices 24-29) - +Y direction
 * 6. Bottom face (indices 30-35) - -Y direction
 * 
 * This function preserves any existing flags that are not part of the face invisibility mask.
 * 
 * @param chunk - The static voxel chunk to process
 */
export const calculateInvisibleFlags = (chunk: VoxelMapChunk): void => {
    // Iterate through each tile (column) in the chunk
    for (let y = 0; y < chunk.size; y++) {
        for (let x = 0; x < chunk.size; x++) {
            const tileIndex = y * chunk.size + x;
            const tile = chunk.tiles.get(tileIndex);
            
            // Skip empty columns
            if (tile.dataLength === 0) {
                continue;
            }
            
            // Check each voxel in this column
            for (let i = 0; i < tile.dataLength; i++) {
                const voxelIndex = tile.dataIndex + i;
                const voxel = chunk.blocks.get(voxelIndex);
                const z = voxel.height;
                
                // Check each face for adjacent voxels
                const hasFront = hasVoxelAt(chunk, x, y, z + 1);     // +Z
                const hasRight = hasVoxelAt(chunk, x + 1, y, z);     // +X
                const hasBack = hasVoxelAt(chunk, x, y, z - 1);      // -Z
                const hasLeft = hasVoxelAt(chunk, x - 1, y, z);      // -X
                const hasTop = hasVoxelAt(chunk, x, y + 1, z);       // +Y
                const hasBottom = hasVoxelAt(chunk, x, y - 1, z);    // -Y
                
                // A face is invisible if there IS an adjacent voxel on that side
                let faceFlags = 0;
                if (hasFront) faceFlags |= FRONT_FACE_INVISIBLE;
                if (hasRight) faceFlags |= RIGHT_FACE_INVISIBLE;
                if (hasBack) faceFlags |= BACK_FACE_INVISIBLE;
                if (hasLeft) faceFlags |= LEFT_FACE_INVISIBLE;
                if (hasTop) faceFlags |= TOP_FACE_INVISIBLE;
                if (hasBottom) faceFlags |= BOTTOM_FACE_INVISIBLE;
                
                // Preserve existing flags that are not part of the face invisibility mask
                const existingFlags = voxel.flags & ~ALL_FACES_INVISIBLE_MASK;
                const newFlags = faceFlags | existingFlags;
                
                // Create a new voxel object with updated flags
                const updatedVoxel = {
                    ...voxel,
                    flags: newFlags
                };
                
                // Update the voxel in the buffer
                chunk.blocks.set(voxelIndex, updatedVoxel);
            }
        }
    }
}; 