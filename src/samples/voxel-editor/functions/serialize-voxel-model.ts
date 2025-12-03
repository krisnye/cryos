import { serializeToJSON } from "@adobe/data/functions";
import { Vec3 } from "@adobe/data/math";
import { Volume } from "data/index.js";
import { MaterialIndex } from "physics/material.js";

/**
 * Voxel model data structure
 */
export type VoxelModel = {
    modelSize: Vec3;
    material: Volume<MaterialIndex>;
    offset: Vec3;
};

/**
 * Serializes a voxel model to a JSON string.
 * Uses @adobe/data serialization system to handle TypedBuffer encoding.
 * Includes workspace size, packed material volume, and offset position.
 * 
 * @param model - The voxel model data
 * @returns JSON string ready to write to file
 */
export const serializeVoxelModel = async (
    model: VoxelModel
): Promise<string> => {
    return await serializeToJSON(model);
};

