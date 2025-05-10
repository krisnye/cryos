import { StaticVoxel, toDebugStaticVoxel } from "./static-voxel";
import { createStaticVoxelColumn, getBaseHeight, getDataOffset, getHeight, StaticVoxelColumn } from "./static-voxel-column";
import { EmptyStaticVoxel, StaticVoxelMap, StaticVoxelMapSize } from "./static-voxel-map";

export interface UnpackedStaticVoxelMap {
    /**
     * Size of the map in both width and height.
     */
    size: StaticVoxelMapSize;
    /**
     * Size * Size array of voxel columns.
     */
    columns: StaticVoxel[][];
}

export const createUnpackedStaticVoxelMap = (size: StaticVoxelMapSize): UnpackedStaticVoxelMap => {
    return {
        size,
        columns: new Array(size * size).fill(null).map(() => []),
    };
}

export const setVoxel = (map: UnpackedStaticVoxelMap, x: number, y: number, z: number, voxel: StaticVoxel) => {
    const columnIndex = y * map.size + x;
    const voxelIndex = z;
    const column = map.columns[columnIndex];
    if (!column) {
        throw new Error(`Column out of bounds: ${x} ${y}`);
    }
    column[voxelIndex] = voxel;
}

export const getVoxel = (map: UnpackedStaticVoxelMap, x: number, y: number, z: number): StaticVoxel => {
    const columnIndex = y * map.size + x;
    const voxelIndex = z;
    return map.columns[columnIndex]?.[voxelIndex] ?? EmptyStaticVoxel;
}

const nonEmpty = (voxel: StaticVoxel) => voxel !== undefined && voxel !== EmptyStaticVoxel;

/**
 * Packs the unpacked static voxel map into a static voxel map.
 * The first element is the size of the map.
 * Next comes size * size elements which are of type StaticVoxelColumn,
 * to compute them, for each column we must find the lowest non-empty voxel and the highest non-empty voxel.
 * Then we can create a StaticVoxelColumn with the voxels between the lowest and highest non-empty voxel.
 * The data for those voxels will be appended to the end of the array, and the packed column entry will contain the offset
 * of the first voxel in the data array for it's data.
 */
export const packStaticVoxelMap = (map: UnpackedStaticVoxelMap): StaticVoxelMap => {
    let dataOffset = 1 + map.size * map.size;
    const data: StaticVoxel[] = [];
    const columns: StaticVoxelColumn[] = [];
    for (let i = 0; i < map.size * map.size; i++) {
        const column = map.columns[i];
        if (!column) {
            throw new Error(`Column out of bounds: ${i}`);
        }
        const baseHeight = Math.max(0, column.findIndex(nonEmpty));
        const highestNonEmptyVoxel = Math.max(baseHeight, column.findLastIndex(nonEmpty));
        const columnHeight = highestNonEmptyVoxel - baseHeight + 1;
        columns.push(createStaticVoxelColumn(baseHeight, columnHeight, dataOffset));
        dataOffset += columnHeight;
        for (let j = baseHeight; j <= highestNonEmptyVoxel; j++) {
            data.push(column[j]);
        }
    }
    return new Uint32Array([map.size, ...columns, ...data]);
}

export const unpackStaticVoxelMap = (map: StaticVoxelMap): UnpackedStaticVoxelMap => {
    const size = map[0];
    const columns = map.slice(1, 1 + size * size);
    const dataStart = 1 + size * size;
    const unpacked = createUnpackedStaticVoxelMap(size);
    for (let i = 0; i < size * size; i++) {
        const column = columns[i];
        const dataOffset = getDataOffset(column);
        const columnBaseHeight = getBaseHeight(column);
        const columnHeight = getHeight(column);
        const columnData = map.slice(dataOffset, dataOffset + columnHeight);
        unpacked.columns[i] = [...Array(columnBaseHeight).fill(EmptyStaticVoxel), ...columnData];
    }
    return unpacked;
}

export const toDebugUnpackedStaticVoxelMap = (map: UnpackedStaticVoxelMap) => {
    return map.columns.map(column => column.map(voxel => toDebugStaticVoxel(voxel)));
}