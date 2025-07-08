
import { System } from "graphics/systems/system.js";
import { MainService } from "../create-main-service.js";
import { copyToGPUBuffer, createStructBuffer, createTypedBuffer } from "@adobe/data/typed-buffer";
import { Vec3Schema, Vec4Schema } from "math/index.js";
import { Vec3Layout } from "math/vec3/vec3.js";
import { Vec4Layout } from "math/vec4/vec4.js";
import { calculateInvisibleFlags } from "samples/voxel/types/static-voxel-chunk/calculate-invisible-flags.js";
import { ALL_FACES_VISIBLE_MASK } from "samples/voxel/types/static-voxel-chunk/index.js";
import { U32Schema } from "@adobe/data/schema";

// Height-based color gradient function
const getHeightColor = (height: number, type: number): [number, number, number, number] => {
    // Normalize height to 0-1 range based on actual terrain generation parameters
    // Base height: 10, height range: 8, so heights range from ~2 to ~18
    const minHeight = 2;
    const maxHeight = 18;
    const normalizedHeight = Math.max(0, Math.min(1, (height - minHeight) / (maxHeight - minHeight)));
    
    if (type === 2) {
        // Green gradient for type 2 particles
        const r = 0.1 + normalizedHeight * 0.2; // 0.1 to 0.3
        const g = 0.3 + normalizedHeight * 0.6; // 0.3 to 0.9
        const b = 0.1 + normalizedHeight * 0.2; // 0.1 to 0.3
        const a = 1.0;
        return [r, g, b, a];
    } else {
        // Original brown/red gradient for other types
        const r = 0.3 + normalizedHeight * 0.6; // 0.3 to 0.9
        const g = 0.2 + normalizedHeight * 0.4; // 0.2 to 0.6
        const b = 0.1 + normalizedHeight * 0.3; // 0.1 to 0.4
        const a = 1.0;
        return [r, g, b, a];
    }
};

export const updateStaticVoxelChunkBuffersSystem = ({ store }: MainService): System => {
    const { device } = store.resources.graphics;
    const positionsTempBuffer = createStructBuffer({ schema: Vec3Schema, length: 16 * 16 * 16 });
    const colorsTempBuffer = createStructBuffer({ schema: Vec4Schema, length: 16 * 16 * 16 });
    const flagsTempBuffer = createTypedBuffer({ schema: U32Schema, length: 16 * 16 * 16 });

    return {
        name: "updateStaticVoxelChunkBuffersSystem",
        phase: "update",
        run: () => {
            let totalVoxels = 0;
            const staticVoxelChunkTable = store.archetypes.StaticVoxelChunk;
            for (let row = 0; row < staticVoxelChunkTable.rows; row++) {
                const chunk = staticVoxelChunkTable.columns.staticVoxelChunk.get(row);
                const dirtyFrame = staticVoxelChunkTable.columns.dirtyFrame.get(row);
                const cleanFrame = staticVoxelChunkTable.columns.cleanFrame.get(row);
                if (dirtyFrame < cleanFrame) {
                    continue;
                }
                else {
                    staticVoxelChunkTable.columns.cleanFrame.set(row, store.resources.renderFrame.count);
                }
                calculateInvisibleFlags(chunk);
                const [offsetX, offsetY, offsetZ] = staticVoxelChunkTable.columns.position.get(row);
                let voxelRenderCount = 0;
                for (let y = 0; y < chunk.size; y++) {
                    for (let x = 0; x < chunk.size; x++) {
                        const index = y * chunk.size + x;
                        const tile = chunk.tiles.get(index);
                        for (let i = 0; i < tile.dataLength; i++) {
                            const voxel = chunk.blocks.get(tile.dataIndex + i);
                            // Skip voxels with no visible faces (face visibility mask is 0)
                            if ((voxel.flags & ALL_FACES_VISIBLE_MASK) === 0) {
                                continue;
                            }
                            totalVoxels++;
                            const worldHeight = offsetZ + voxel.height;
                            positionsTempBuffer.set(voxelRenderCount, [offsetX + x, offsetY + y, worldHeight]);
                            colorsTempBuffer.set(voxelRenderCount, getHeightColor(worldHeight, voxel.type));
                            flagsTempBuffer.set(voxelRenderCount, voxel.flags);
                            voxelRenderCount++;
                        }
                    }
                }
                staticVoxelChunkTable.columns.staticVoxelChunkPositionsBuffer.set(row, 
                    copyToGPUBuffer(
                        positionsTempBuffer,
                        device,
                        staticVoxelChunkTable.columns.staticVoxelChunkPositionsBuffer.get(row),
                        voxelRenderCount * Vec3Layout.size
                    )
                );
                staticVoxelChunkTable.columns.staticVoxelChunkColorsBuffer.set(row, 
                    copyToGPUBuffer(
                        colorsTempBuffer,
                        device,
                        staticVoxelChunkTable.columns.staticVoxelChunkColorsBuffer.get(row),
                        voxelRenderCount * Vec4Layout.size
                    )
                );
                staticVoxelChunkTable.columns.staticVoxelChunkFlagsBuffer.set(row, 
                    copyToGPUBuffer(
                        flagsTempBuffer,
                        device,
                        staticVoxelChunkTable.columns.staticVoxelChunkFlagsBuffer.get(row),
                        voxelRenderCount * 4 // u32 = 4 bytes
                    )
                );
                staticVoxelChunkTable.columns.staticVoxelChunkRenderCount.set(row, voxelRenderCount);
            }
            // console.log("totalVoxels", totalVoxels);

        }
    }
};
