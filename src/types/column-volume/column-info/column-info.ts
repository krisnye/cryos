// © 2026 Adobe. MIT License. See /LICENSE for details.

/**
 * ColumnInfo is a u32 value that packs three pieces of information:
 * - High 16 bits: data offset for column start (0-65535)
 * - Mid 8 bits: column data length (0-255)
 * - Low 8 bits: column z start offset in model space (0-255)
 */
export type ColumnInfo = number;

export * as ColumnInfo from "./namespace.js";


