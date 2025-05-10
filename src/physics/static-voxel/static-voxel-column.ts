
export type StaticVoxelColumn = number;

const StaticVoxelColumnBaseHeightBits = 8;
const StaticVoxelColumnHeightBits = 8;
const StaticVoxelColumnDataOffsetBits = 16;

const StaticVoxelColumnBaseHeightMask = 0x000000FF;
const StaticVoxelColumnHeightMask = 0x0000FF00;
const StaticVoxelColumnDataOffsetMask = 0xFFFF0000;

const StaticVoxelColumnBaseHeightShift = 0;
const StaticVoxelColumnHeightShift = StaticVoxelColumnBaseHeightShift + StaticVoxelColumnBaseHeightBits;
const StaticVoxelColumnDataOffsetShift = StaticVoxelColumnHeightShift + StaticVoxelColumnHeightBits;

export const getBaseHeight = (packed: StaticVoxelColumn): number => (packed & StaticVoxelColumnBaseHeightMask) >> StaticVoxelColumnBaseHeightShift;
export const getHeight = (packed: StaticVoxelColumn): number => (packed & StaticVoxelColumnHeightMask) >> StaticVoxelColumnHeightShift;
export const getDataOffset = (packed: StaticVoxelColumn): number => (packed & StaticVoxelColumnDataOffsetMask) >> StaticVoxelColumnDataOffsetShift;

export const setBaseHeight = (packed: StaticVoxelColumn, minHeight: number): StaticVoxelColumn => (packed & ~StaticVoxelColumnBaseHeightMask) | (minHeight << StaticVoxelColumnBaseHeightShift);
export const setHeight = (packed: StaticVoxelColumn, maxHeight: number): StaticVoxelColumn => (packed & ~StaticVoxelColumnHeightMask) | (maxHeight << StaticVoxelColumnHeightShift);
export const setDataOffset = (packed: StaticVoxelColumn, dataOffset: number): StaticVoxelColumn => (packed & ~StaticVoxelColumnDataOffsetMask) | (dataOffset << StaticVoxelColumnDataOffsetShift);

export const createStaticVoxelColumn = (baseHeight: number, height: number, dataOffset: number): StaticVoxelColumn => setHeight(setBaseHeight(setDataOffset(0, dataOffset), baseHeight), height);

export const toDebugStaticVoxelColumn = (packed: StaticVoxelColumn) => {
    const baseHeight = getBaseHeight(packed);
    const height = getHeight(packed);
    const dataOffset = getDataOffset(packed);
    return { baseHeight, height, dataOffset };
}
