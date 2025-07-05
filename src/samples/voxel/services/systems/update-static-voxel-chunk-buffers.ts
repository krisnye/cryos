
import { System } from "graphics/systems/system.js";
import { MainService } from "../create-main-service.js";
import { copyToGPUBuffer, createStructBuffer } from "@adobe/data/typed-buffer";
import { Vec3Schema, Vec4Schema } from "math/index.js";
import { Vec3Layout } from "math/vec3/vec3.js";
import { Vec4Layout } from "math/vec4/vec4.js";

export const updateStaticVoxelChunkBuffersSystem = ({ store }: MainService): System => {
    const { device } = store.resources.graphics;
    const positionsTempBuffer = createStructBuffer({ schema: Vec3Schema, length: 16 * 16 * 16 });
    const colorsTempBuffer = createStructBuffer({ schema: Vec4Schema, length: 16 * 16 * 16 });

    return {
        name: "updateStaticVoxelChunkBuffersSystem",
        phase: "update",
        run: () => {
            const staticVoxelChunkTable = store.archetypes.StaticVoxelChunk;
            for (let row = 0; row < staticVoxelChunkTable.rows; row++) {
                const chunk = staticVoxelChunkTable.columns.staticVoxelChunk.get(row);
                const [offsetX, offsetY, offsetZ] = staticVoxelChunkTable.columns.position.get(row);
                let voxelRenderCount = 0;
                for (let y = 0; y < chunk.size; y++) {
                    for (let x = 0; x < chunk.size; x++) {
                        const index = y * chunk.size + x;
                        const tile = chunk.tiles.get(index);
                        for (let i = 0; i < tile.dataLength; i++) {
                            const voxel = chunk.blocks.get(tile.dataIndex + i);
                            positionsTempBuffer.set(voxelRenderCount, [offsetX + x, offsetY + y, offsetZ + voxel.height]);
                            colorsTempBuffer.set(voxelRenderCount, [0.9, 0.6, 0.4, 1]); // TODO color conversion.
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
                staticVoxelChunkTable.columns.staticVoxelChunkRenderCount.set(row, voxelRenderCount);
            }
        }
    }
};
