import { createStructBuffer } from "@adobe/data/typed-buffer";
import { StaticVoxelSchema } from "../static-voxel/static-voxel.js";
import { StructureMapTileSchema } from "../generic-chunk/generic-chunk.js";
import { VoxelMapChunk } from "./static-voxel-chunk.js";

export const createStaticVoxelChunk = (size: number): VoxelMapChunk => {
    return {
        size,
        tiles: createStructBuffer(StructureMapTileSchema, size * size),
        blocks: createStructBuffer(StaticVoxelSchema, size * size),
    }
}