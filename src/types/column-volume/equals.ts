// © 2026 Adobe. MIT License. See /LICENSE for details.
import type { ColumnVolume } from "./column-volume.js";
import { typedBufferEquals } from "@adobe/data/typed-buffer/typed-buffer-equals";

/**
 * Compare two Vec3 arrays for equality.
 */
const vec3Equals = (a: readonly [number, number, number], b: readonly [number, number, number]): boolean => {
    return a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
};

/**
 * Compare two Uint32Array instances for equality.
 */
const uint32ArrayEquals = (a: Uint32Array, b: Uint32Array): boolean => {
    if (a === b) return true; // fast path
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) return false;
    }
    return true;
};

/**
 * Compare two ColumnVolume instances for equality.
 * @param a First column volume
 * @param b Second column volume
 * @returns True if volumes are equal (same type, size, tile array, and data)
 */
export const equals = <T>(a: ColumnVolume<T>, b: ColumnVolume<T>): boolean => {
    if (a === b) return true; // fast path
    if (a.type !== b.type) return false;
    if (!vec3Equals(a.size, b.size)) return false;
    if (!uint32ArrayEquals(a.tile, b.tile)) return false;
    return typedBufferEquals(a.data, b.data);
};

