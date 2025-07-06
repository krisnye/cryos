import { FromSchema, Schema, U32Schema } from "@adobe/data/schema";
import { TypedBuffer } from "@adobe/data/typed-buffer";

/**
 * Metadata for a single X × Y "tile" in a {@link GenericChunk}.
 *
 * Every tile owns a **contiguous** slice inside the shared `blocks` buffer:
 *
 * - `height` – Highest `Z` coordinate (exclusive) of any block in this tile.
 *               Lets you skip empty air quickly when traversing vertically.
 * - `dataIndex` – Zero-based offset in `blocks` where this tile's data starts.
 * - `dataLength` – Number of blocks belonging to this tile.
 *                  `0` ⇒ empty column.
 *
 * Because all columns live in one packed array, you pay one indirection
 * per lookup yet keep the data cache-friendly and trivially serialisable.
 */
export const StructureMapTileSchema = {
    type: "object",
    properties: {
        height: U32Schema,
        dataIndex: U32Schema,
        dataLength: U32Schema,
    },
    required: ["height", "dataIndex", "dataLength"],
    additionalProperties: false,
} as const satisfies Schema;

export type StructureMapTile = FromSchema<typeof StructureMapTileSchema>;

/**
 * Packed 2-D grid of variable-height block columns.
 *
 * Think of it as a *structural height-map*:  
 * `tiles` is a `size × size` flat array laid out row-major (`y * size + x`).  
 * Each entry tells you where its column lives inside the shared `blocks` buffer.
 *
 * @typeParam T – Tile metadata (must extend {@link StructureMapTile}).
 * @typeParam B – Block / voxel payload stored contiguously in `blocks`.
 *
 * ### Invariants
 * 1. `size` is normally a power of two (makes mip-mapping & bit-masking cheap).
 * 2. `tiles.length === size * size`.
 * 3. For every tile `t`: `t.dataIndex + t.dataLength` is within `blocks.length`.
 *
 * ### Why this layout?
 * * **Spatial locality** – All blocks live in one TypedArray / vector,
 *   great for cache-coherent iteration and zero-copy serialisation.
 * * **O(1) column access** – One array lookup + slice math.
 * * **Sparse-friendly** – Empty tiles cost 12 bytes (`height`, `index`, `len`), no
 *   wasted space for air.
 */
export interface GenericChunk<
  B extends { height: number },
  T extends StructureMapTile = StructureMapTile,
> {
  /** World width/length in tiles (`size × size` total). */
  readonly size: number;

  /** Row-major list of column descriptors. Length = `size * size`. */
  readonly tiles: TypedBuffer<T>;

  /** Packed backing store of blocks / voxels. */
  readonly blocks: TypedBuffer<B>;
}
