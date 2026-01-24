// © 2026 Adobe. MIT License. See /LICENSE for details.
import type { ColumnVolume } from "./column-volume.js";
import { TypedBuffer } from "@adobe/data/typed-buffer";
import { Vec3 } from "@adobe/data/math";
import { equals as dataEquals } from "@adobe/data/equals";

/**
 * Compare two ColumnVolume instances for equality.
 * @param a First column volume
 * @param b Second column volume
 * @returns True if volumes are equal (same type, size, tile array, and data)
 */
export const equals = <T>(a: ColumnVolume<T>, b: ColumnVolume<T>): boolean => {
    if (a === b) return true; // fast path
    if (a.type !== b.type) return false;
    if (!Vec3.equals(a.size, b.size)) return false;
    if (!dataEquals(a.tile, b.tile)) return false;
    return TypedBuffer.equals(a.data, b.data);
};

