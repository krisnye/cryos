import { TypedBuffer } from "@adobe/data/typed-buffer";
import type { DenseVolume } from "./dense-volume.js";
import { Vec3 } from "@adobe/data/math";

/**
 * Compare two DenseVolume instances for equality.
 * @param a First dense volume
 * @param b Second dense volume
 * @returns True if volumes are equal (same type, size, and data)
 */
export const equals = <T>(a: DenseVolume<T>, b: DenseVolume<T>): boolean => {
    if (a === b) return true; // fast path
    if (a.type !== b.type) return false;
    if (!Vec3.equals(a.size, b.size)) return false;
    return TypedBuffer.equals(a.data, b.data);
};

