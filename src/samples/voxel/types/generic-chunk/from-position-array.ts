import { Vec3 } from "math/index.js";
import { GenericChunk } from "./generic-chunk.js";

/**
 * Converts a flat array of 3D positioned objects into a spatial chunk structure.
 * 
 * This function transforms scattered 3D objects into a complete 2D grid of vertical columns,
 * where each grid position (size × size total) contains a sorted stack of objects arranged by height.
 * Empty columns have dataLength: 0 and height: 0. The result is optimized for efficient spatial queries.
 * 
 * @param array - Array of objects with 3D positions. Each object must have a `position` property
 *                of type `Vec3` (3D coordinates) plus arbitrary data of type `T`.
 * @param structureMap - The target chunk structure to update. Must be a `GenericChunk` that can
 *                       store objects of type `T & { height: number }`.
 * 
 * @throws {Error} When any object's X or Y position is outside the chunk bounds (0 to size-1).
 * 
 * ### Algorithm
 * 1. **Spatial Partitioning**: Groups objects by X,Y coordinates into columns
 * 2. **Height Sorting**: Sorts objects within each column by Z-coordinate (ascending)
 * 3. **Packed Storage**: Stores all objects contiguously in the blocks buffer
 * 4. **Metadata Creation**: Updates tile metadata with data indices and heights
 * 
 * ### Performance Characteristics
 * - **Time Complexity**: O(n log n) due to sorting each column
 * - **Space Complexity**: O(n) for temporary column arrays
 * - **Cache Efficiency**: Results in contiguous memory layout for spatial queries
 * 
 * @example
 * ```typescript
 * const voxels = [
 *   { position: [0, 0, 1], type: 'stone' },
 *   { position: [0, 0, 2], type: 'dirt' },
 *   { position: [1, 1, 0], type: 'grass' }
 * ];
 * 
 * updateStructureMapFromPositionArray(voxels, chunk);
 * // Result: chunk has size×size tiles, with populated columns at (0,0) and (1,1)
 * // All other tiles have dataLength: 0 and height: 0
 * ```
 */
export function updateStructureMapFromPositionArray<T>(
    array: (T & { position: Vec3 })[],
    structureMap: GenericChunk<T & { height: number }>,
) {
    const { size, tiles, blocks } = structureMap;
    // first we will create an array of arrays which are columns in each map position
    const columns = new Array(size * size).fill(null).map(() => new Array<T & { position: Vec3 }>());
    // then we will iterate over the array and add the items to the correct column based on position
    // we will throw an error if the position x or y is < 0 or >= size
    for (const item of array) {
        const [x, y, _z] = item.position;
        if (x < 0 || x >= size || y < 0 || y >= size) {
            throw new Error(`Position ${JSON.stringify(item.position)} is out of bounds for chunk size ${size}`);
        }
        columns[y * size + x].push(item);
    }
    // next we will sort the columns by z and count the total elements
    let totalElements = 0;
    for (let i = 0; i < columns.length; i++) {
        const column = columns[i];
        column.sort((a, b) => a.position[2] - b.position[2]);
        totalElements += column.length;
    }
    // then we will update the structure map with the new columns while writing to the blocks buffer
    if (totalElements > blocks.capacity) {
        // ensure the blocks buffer is large enough
        blocks.capacity = blocks.capacity = totalElements;
    }
    let index = 0;
    for (let i = 0; i < size * size; i++) {
        const column = columns[i];
        const tile = tiles.get(i);
        tiles.set(i, {
            ...tile,
            dataIndex: index,
            dataLength: column.length,
            height: column.length > 0 ? column[column.length - 1].position[2] : 0,
        });
        for (const item of column) {
            const { position, ...rest } = item;
            blocks.set(index, {
                ...rest,
                height: position[2],
            } as T & { height: number } satisfies T & { height: number });
            index++;
        }
    }
}
