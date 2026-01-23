// © 2026 Adobe. MIT License. See /LICENSE for details.
import { Vec3 } from "@adobe/data/math";
import { createTypedBuffer } from "@adobe/data/typed-buffer";
import type { ColumnVolume } from "./column-volume.js";
import { DenseVolume } from "types/dense-volume/dense-volume.js";
import * as DenseVolumeNamespace from "types/dense-volume/namespace.js";
import { packColumnInfo, EMPTY_COLUMN } from "./column-info.js";

/**
 * Creates a new column volume from a dense volume.
 * We will identify empty voxels by using the volume.data.schema.default value.
 * For TypedArray-backed buffers (number, struct), the default is implicitly 0.
 * For array buffers, schema.default must be explicitly defined.
 * @param volume The dense volume to convert
 * @returns A new ColumnVolume with sparse column-based representation
 */
export const create = <T>(volume: DenseVolume<T>): ColumnVolume<T> => {
    const [width, height, depth] = volume.size;
    const schema = volume.data.schema;

    // Validate schema.default: TypedArray-backed buffers have implicit default of 0
    // Array buffers require explicit schema.default
    const isTypedArrayBacked = schema.type === "number" || schema.type === "integer" || schema.type === "object";
    if (!isTypedArrayBacked && !('default' in schema)) {
        throw new Error("DenseVolume schema must have a default value");
    }

    // Track columns and data
    const columns: Array<{ x: number; y: number; zStart: number; zEnd: number; voxels: T[] }> = [];
    let dataOffset = 0;
    let maxZ = 0;

    // Process each column (x,y position)
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            // Find first and last non-empty voxels in this column
            let zStart: number | undefined = undefined;
            let zEnd: number | undefined = undefined;

            for (let z = 0; z < depth; z++) {
                const index = DenseVolumeNamespace.index(volume, x, y, z);
                const isEmpty = volume.data.isDefault(index);

                if (!isEmpty) {
                    if (zStart === undefined) {
                        zStart = z;
                    }
                    zEnd = z;
                }
            }

            // If column has non-empty voxels, add it
            if (zStart !== undefined && zEnd !== undefined) {
                // Collect all voxels from zStart to zEnd (including gaps)
                const voxels: T[] = [];
                for (let z = zStart; z <= zEnd; z++) {
                    const index = DenseVolumeNamespace.index(volume, x, y, z);
                    voxels.push(volume.data.get(index));
                }

                columns.push({
                    x,
                    y,
                    zStart,
                    zEnd,
                    voxels,
                });

                // Update maxZ
                maxZ = Math.max(maxZ, zEnd + 1);

                // Update dataOffset for next column
                dataOffset += voxels.length;
            }
        }
    }

    // Build data buffer
    const totalVoxels = columns.reduce((sum, col) => sum + col.voxels.length, 0);
    const dataBuffer = createTypedBuffer(schema, totalVoxels);

    let currentDataOffset = 0;
    for (const column of columns) {
        for (let i = 0; i < column.voxels.length; i++) {
            dataBuffer.set(currentDataOffset + i, column.voxels[i]);
        }
        currentDataOffset += column.voxels.length;
    }

    // Build tile array
    const tile = new Uint32Array(width * height);
    // Initialize all tiles as empty
    tile.fill(EMPTY_COLUMN);

    let columnDataOffset = 0;
    for (const column of columns) {
        const tileIdx = column.x + column.y * width;
        const length = column.zEnd - column.zStart + 1;
        tile[tileIdx] = packColumnInfo(columnDataOffset, length, column.zStart);
        columnDataOffset += length;
    }

    // Calculate output size
    const outputSize: Vec3 = [width, height, maxZ];

    return {
        type: "column",
        size: outputSize,
        tile,
        data: dataBuffer,
    };
};

