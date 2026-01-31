// © 2026 Adobe. MIT License. See /LICENSE for details.

/**
 * ColumnInfo is a u32 value that packs three pieces of information:
 * - High 16 bits: data offset for column start (0-65535)
 * - Mid 8 bits: column data length (0-255)
 * - Low 8 bits: column z start offset in model space (0-255)
 */
export type ColumnInfo = number;

/**
 * Sentinel value indicating an empty column (no data).
 */
export const EMPTY_COLUMN: ColumnInfo = 0xFFFFFFFF;

/**
 * Packs column metadata into a ColumnInfo u32 value.
 * @param dataOffset Data offset for column start (0-65535)
 * @param length Column data length (0-255)
 * @param zStart Column z start offset in model space (0-255)
 * @returns Packed ColumnInfo value
 * @throws If any value is out of range
 */
export const packColumnInfo = (dataOffset: number, length: number, zStart: number): ColumnInfo => {
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
export const unpackColumnInfo = (columnInfo: ColumnInfo): { dataOffset: number; length: number; zStart: number } => {
    return {
        dataOffset: (columnInfo >>> 16) & 0xFFFF,
        length: (columnInfo >>> 8) & 0xFF,
        zStart: columnInfo & 0xFF,
    };
};

/**
 * Checks if a ColumnInfo value represents an empty column.
 * @param columnInfo ColumnInfo value to check
 * @returns True if the column is empty
 */
export const isEmptyColumn = (columnInfo: ColumnInfo): boolean => {
    return columnInfo === EMPTY_COLUMN;
};

