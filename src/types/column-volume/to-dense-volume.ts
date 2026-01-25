import { createTypedBuffer } from "@adobe/data/typed-buffer";
import { ColumnVolume } from "./column-volume.js";
import { DenseVolume } from "types/dense-volume/dense-volume.js";
import { ColumnInfo } from "./column-info/column-info.js";

/**
 * Converts a ColumnVolume back to a DenseVolume.
 * Reconstructs a dense volume from a sparse column-based representation by:
 * 1. Creating a dense buffer initialized with default values
 * 2. Iterating through each column and copying voxel data to the correct positions
 * 3. Handling empty columns (filling with defaults)
 * 4. Handling columns with z-offsets (filling gaps with defaults)
 * 
 * @param volume The column volume to convert
 * @returns A new DenseVolume with dense representation
 */
export const toDenseVolume = <T>(volume: ColumnVolume<T>): DenseVolume<T> => {
    const [width, height, depth] = volume.size;
    const schema = volume.data.schema;

    // Create dense buffer with capacity for all voxels
    const capacity = width * height * depth;
    const denseVolume = DenseVolume.create({ size: volume.size, data: createTypedBuffer(schema, capacity) });

    // Process each column (x,y position)
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const tileIdx = x + y * width;
            const columnInfo = volume.tile[tileIdx];

            // Column with data: unpack ColumnInfo and copy voxels
            const { dataOffset, length, zStart } = ColumnInfo.unpack(columnInfo);

            // Copy column voxels
            for (let i = 0; i < length; i++) {
                const z = zStart + i;
                const denseIndex = DenseVolume.getIndex(
                    denseVolume,
                    x,
                    y,
                    z
                );
                denseVolume.data.set(denseIndex, volume.data.get(dataOffset + i));
            }
        }
    }

    return denseVolume;
};

