import { StaticVoxel } from "../static-voxel/static-voxel.js";
import { GenericChunk } from "../generic-chunk/generic-chunk.js";
import { Schema } from "@adobe/data/schema";

export type VoxelMapChunk = GenericChunk<StaticVoxel>;

export const StaticVoxelChunkSchema = {
    // This makes FromSchema<typeof VoxelMapChunkSchema> equal VoxelMapChunk
    default: null as unknown as VoxelMapChunk,
} as const satisfies Schema;
