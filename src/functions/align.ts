/**
 * Aligns a size to a specified boundary.
 * Used to enforce WGSL alignment requirements for uniform and storage buffers.
 *
 * @param size - The size to align
 * @param alignment - The alignment boundary (power of 2)
 * @returns The size rounded up to the next multiple of alignment
 *
 * @see https://www.w3.org/TR/WGSL/#alignment-and-size
 * @see https://gpuweb.github.io/gpuweb/wgsl/#alignment-and-size
 */
export function align(size: number, alignment: number): number {
    return Math.ceil(size / alignment) * alignment;
}
