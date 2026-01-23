import { Vec3 } from "@adobe/data/math";
import { TypedBuffer } from "@adobe/data/typed-buffer";

// u32 bits,
// high 16 bits: data offset for column start (0-65535)
// mid 8 bits: column data length (0-255)
// low 8 bits: column z start offset in model space (0-255)
type ColumnInfo = number;

/**
 * Sparse column-based volume representation optimized for volumes with many empty regions.
 * 
 * Stores only non-empty columns, where each column is a vertical stack of voxels at a given (x,y) position.
 * Each column can have variable height and start at any z position, making this ideal for terrain or
 * structures with varying ground levels and sparse air space.
 * 
 * Structure:
 * - `tile`: Uint32Array mapping (x,y) positions to ColumnInfo metadata (bit-packed: data offset, length, z start)
 * - `data`: TypedBuffer containing sequential voxel data organized by columns
 * - `size`: Bounding box dimensions (z is max of all column heights + z offsets)
 * 
 * Memory efficient compared to DenseVolume for sparse data, as empty columns consume no voxel storage.
 * 
 * @template T The type of data stored in each voxel (e.g., MaterialId)
 */
export type ColumnVolume<T> = {
    readonly type: "column";
    /**
     * The size of the volume in model space.
     * x and y are the size of the base tile. z is Math.max(...tile[*].(z start offset + data.length))
     * x and y are fixed size. z should be updated if the volume columns max height changes.
     */
    readonly size: Vec3;
    /**
     * The array of column offsets of type ColumnInfo.
     * Length is size.x * size.y
     * Each index is x + (y * size.x)
     */
    readonly tile: Uint32Array;
    /**
     * The column data buffer. Offsets, lengths and z offsets are stored in the tile array.
     */
    readonly data: TypedBuffer<T>;
};
export * as ColumnVolume from "./namespace.js";

