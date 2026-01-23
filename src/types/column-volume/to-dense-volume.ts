// © 2026 Adobe. MIT License. See /LICENSE for details.
import { Vec3 } from "@adobe/data/math";
import { createTypedBuffer } from "@adobe/data/typed-buffer";
import type { ColumnVolume } from "./column-volume.js";
import { DenseVolume } from "types/dense-volume/dense-volume.js";
import * as DenseVolumeNamespace from "types/dense-volume/namespace.js";
import { isEmptyColumn, unpackColumnInfo } from "./column-info.js";

/**
 * Gets the default value for a TypedBuffer schema.
 * For TypedArray-backed buffers (number, integer, struct), the default is implicitly 0.
 * For array buffers, uses schema.default (can be undefined).
 * For const buffers, uses schema.const.
 */
const getDefaultValue = <T>(schema: { type?: string; default?: T; const?: T }): T | 0 => {
    // TypedArray-backed buffers have implicit default of 0
    const isTypedArrayBacked = schema.type === "number" || schema.type === "integer" || schema.type === "object";
    if (isTypedArrayBacked) {
        return 0 as T;
    }

    // Const buffers use schema.const
    if (schema.const !== undefined) {
        return schema.const;
    }

    // Array buffers use schema.default (can be undefined)
    return schema.default as T | 0;
};

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
    const defaultValue = getDefaultValue(schema);

    // Create dense buffer with capacity for all voxels
    const capacity = width * height * depth;
    const denseBuffer = createTypedBuffer(schema, capacity);

    // Initialize with defaults (TypedArray-backed buffers auto-initialize to 0)
    // For array buffers, explicitly set defaults
    const isTypedArrayBacked = schema.type === "number" || schema.type === "integer" || schema.type === "object";
    if (!isTypedArrayBacked && defaultValue !== undefined) {
        for (let i = 0; i < capacity; i++) {
            denseBuffer.set(i, defaultValue);
        }
    }

    // Process each column (x,y position)
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const tileIdx = x + y * width;
            const columnInfo = volume.tile[tileIdx];

            if (isEmptyColumn(columnInfo)) {
                // Empty column: fill entire z-range with defaults
                for (let z = 0; z < depth; z++) {
                    const denseIndex = DenseVolumeNamespace.index(
                        { type: "dense", size: volume.size, data: denseBuffer } as DenseVolume<T>,
                        x,
                        y,
                        z
                    );
                    if (!isTypedArrayBacked) {
                        denseBuffer.set(denseIndex, defaultValue);
                    }
                }
            } else {
                // Column with data: unpack ColumnInfo and copy voxels
                const { dataOffset, length, zStart } = unpackColumnInfo(columnInfo);

                // Fill region before column data with defaults
                for (let z = 0; z < zStart; z++) {
                    const denseIndex = DenseVolumeNamespace.index(
                        { type: "dense", size: volume.size, data: denseBuffer } as DenseVolume<T>,
                        x,
                        y,
                        z
                    );
                    if (!isTypedArrayBacked) {
                        denseBuffer.set(denseIndex, defaultValue);
                    }
                }

                // Copy column voxels
                for (let i = 0; i < length; i++) {
                    const z = zStart + i;
                    const denseIndex = DenseVolumeNamespace.index(
                        { type: "dense", size: volume.size, data: denseBuffer } as DenseVolume<T>,
                        x,
                        y,
                        z
                    );
                    denseBuffer.set(denseIndex, volume.data.get(dataOffset + i));
                }

                // Fill region after column data with defaults
                for (let z = zStart + length; z < depth; z++) {
                    const denseIndex = DenseVolumeNamespace.index(
                        { type: "dense", size: volume.size, data: denseBuffer } as DenseVolume<T>,
                        x,
                        y,
                        z
                    );
                    if (!isTypedArrayBacked) {
                        denseBuffer.set(denseIndex, defaultValue);
                    }
                }
            }
        }
    }

    return {
        type: "dense",
        size: volume.size,
        data: denseBuffer,
    };
};

