
export type StaticVoxel = number;

type StaticVoxelBond = typeof StaticVoxelUnbondX | typeof StaticVoxelUnbondY | typeof StaticVoxelUnbondZ;
const StaticVoxelInvisibleBits = 1;
const StaticVoxelUnbondBits = 3;
const StaticVoxelDamageBits = 4;
const StaticVoxelTempBits = 13;
const StaticVoxelTypeBits = 10;

const StaticVoxelInvisibleMask =                               0b1;
export const StaticVoxelUnbondX =                           0b0010;
export const StaticVoxelUnbondY =                           0b0100;
export const StaticVoxelUnbondZ =                           0b1000;
const StaticVoxelDamageMask =                           0b11110000;
const StaticVoxelTempMask =                0b111111111111100000000;
const StaticVoxelTypeMask =     0b01111111111000000000000000000000;
const StaticVoxelUnbondShift = StaticVoxelInvisibleBits;
const StaticVoxelDamageShift = StaticVoxelUnbondShift + StaticVoxelUnbondBits;
const StaticVoxelTempShift = StaticVoxelDamageShift + StaticVoxelDamageBits;
const StaticVoxelTypeShift = StaticVoxelTempShift + StaticVoxelTempBits;

export const getVisible = (packed: StaticVoxel): boolean => (packed & StaticVoxelInvisibleMask) !== StaticVoxelInvisibleMask;
export const getBond = (packed: StaticVoxel, bond: StaticVoxelBond): boolean => (packed & bond) !== bond;
export const getDamage = (packed: StaticVoxel): number => (packed & StaticVoxelDamageMask) >> StaticVoxelDamageShift;
export const getTemp = (packed: StaticVoxel): number => (packed & StaticVoxelTempMask) >> StaticVoxelTempShift;
export const getType = (packed: StaticVoxel): number => (packed & StaticVoxelTypeMask) >> StaticVoxelTypeShift;

export const setVisible = (packed: StaticVoxel, visible: boolean): StaticVoxel => visible ?  packed & ~StaticVoxelInvisibleMask : packed | StaticVoxelInvisibleMask;
export const setBond = (packed: StaticVoxel, bond: StaticVoxelBond, value: boolean): StaticVoxel => value ? packed & ~bond : packed | bond;
export const setDamage = (packed: StaticVoxel, damage: number): StaticVoxel => (packed & ~StaticVoxelDamageMask) | (damage << StaticVoxelDamageShift);
export const setTemp = (packed: StaticVoxel, temp: number): StaticVoxel => (packed & ~StaticVoxelTempMask) | (temp << StaticVoxelTempShift);
export const setType = (packed: StaticVoxel, type: number): StaticVoxel => (packed & ~StaticVoxelTypeMask) | (type << StaticVoxelTypeShift);

export const toDebugStaticVoxel = (packed: StaticVoxel) => {
    const visible = getVisible(packed);
    const bond = getBond(packed, StaticVoxelUnbondX);
    const damage = getDamage(packed);
    const temp = getTemp(packed);
    const type = getType(packed);
    return { visible, bond, damage, temp, type };
}
