import { deserializeFromJSON } from "@adobe/data/functions";
import { VoxelModel } from "./serialize-voxel-model.js";

/**
 * Deserializes a voxel model from JSON string.
 * Uses @adobe/data deserialization system to handle TypedBuffer decoding.
 * 
 * @param jsonString - JSON string from file
 * @returns Deserialized voxel model with workspace info
 * @throws Error if data is invalid
 */
export const deserializeVoxelModel = async (jsonString: string): Promise<VoxelModel> => {
    return await deserializeFromJSON<VoxelModel>(jsonString);
};

