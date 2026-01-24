// © 2026 Adobe. MIT License. See /LICENSE for details.

import type { ColumnInfo } from "./column-info.js";

/**
 * Packs column metadata into a ColumnInfo u32 value.
 * @param dataOffset Data offset for column start (0-65535)
 * @param length Column data length (0-255)
 * @param zStart Column z start offset in model space (0-255)
 * @returns Packed ColumnInfo value
 * @throws If any value is out of range
 */
export const pack = (dataOffset: number, length: number, zStart: number): ColumnInfo => {
    if (dataOffset < 0 || dataOffset > 65535) {
        throw new Error(`Data offset ${dataOffset} is out of range [0, 65535]`);
    }
    if (length < 0 || length > 255) {
        throw new Error(`Length ${length} is out of range [0, 255]`);
    }
    if (zStart < 0 || zStart > 255) {
        throw new Error(`Z start ${zStart} is out of range [0, 255]`);
    }
    return (dataOffset << 16) | (length << 8) | zStart;
};

/**
 * Unpacks a ColumnInfo u32 value into its components.
 * @param columnInfo Packed ColumnInfo value
 * @returns Object with dataOffset, length, and zStart
 */
export const unpack = (columnInfo: ColumnInfo): { dataOffset: number; length: number; zStart: number } => {
    return {
        dataOffset: (columnInfo >>> 16) & 0xFFFF,
        length: (columnInfo >>> 8) & 0xFF,
        zStart: columnInfo & 0xFF,
    };
};

// Intentionally no `isEmpty()` helper: emptiness is represented as `length === 0`,
// and we avoid adding hot-path helpers until a real performance need exists.


