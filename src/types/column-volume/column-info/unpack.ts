
import type { ColumnInfo } from "./column-info.js";

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

