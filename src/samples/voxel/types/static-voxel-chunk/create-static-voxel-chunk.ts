import { createStructBuffer } from "@adobe/data/typed-buffer";
import { StaticVoxelSchema } from "../static-voxel/static-voxel.js";
import { StructureMapTileSchema } from "../generic-chunk/generic-chunk.js";
import { VoxelMapChunk } from "./static-voxel-chunk.js";

export const createStaticVoxelChunk = (size: number): VoxelMapChunk => {
    return {
        size,
        tiles: createStructBuffer({
            schema: StructureMapTileSchema,
            length: size * size,
        }),
        blocks: createStructBuffer({
            schema: StaticVoxelSchema,
            length: size * size, // may grow larger.
        }),
    }
}