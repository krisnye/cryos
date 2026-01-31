// © 2026 Adobe. MIT License. See /LICENSE for details.
import type { DenseVolume } from "./dense-volume.js";
import { typedBufferEquals } from "@adobe/data/typed-buffer/typed-buffer-equals";

/**
 * Compare two Vec3 arrays for equality.
 */
const vec3Equals = (a: readonly [number, number, number], b: readonly [number, number, number]): boolean => {
    return a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
};

/**
 * Compare two DenseVolume instances for equality.
 * @param a First dense volume
 * @param b Second dense volume
 * @returns True if volumes are equal (same type, size, and data)
 */
export const equals = <T>(a: DenseVolume<T>, b: DenseVolume<T>): boolean => {
    if (a === b) return true; // fast path
    if (a.type !== b.type) return false;
    if (!vec3Equals(a.size, b.size)) return false;
    return typedBufferEquals(a.data, b.data);
};

