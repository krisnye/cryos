
export type StaticVoxel = number;

type StaticVoxelBond = typeof StaticVoxelUnbondX | typeof StaticVoxelUnbondY | typeof StaticVoxelUnbondZ;
const StaticVoxelUnbondBits = 3;
const StaticVoxelDamageBits = 4;
const StaticVoxelTempBits = 13;
const StaticVoxelTypeBits = 11;

export const StaticVoxelUnbondX =                            0b001;
export const StaticVoxelUnbondY =                            0b010;
export const StaticVoxelUnbondZ =                            0b100;
const StaticVoxelDamageMask =                            0b1111000;
const StaticVoxelTempMask =                 0b11111111111110000000;
const StaticVoxelTypeMask =     0b01111111111100000000000000000000;
const StaticVoxelUnbondShift = 0;
const StaticVoxelDamageShift = StaticVoxelUnbondShift + StaticVoxelUnbondBits;
const StaticVoxelTempShift = StaticVoxelDamageShift + StaticVoxelDamageBits;
const StaticVoxelTypeShift = StaticVoxelTempShift + StaticVoxelTempBits;

export const getBond = (packed: StaticVoxel, bond: StaticVoxelBond): boolean => (packed & bond) !== bond;
export const getDamage = (packed: StaticVoxel): number => (packed & StaticVoxelDamageMask) >> StaticVoxelDamageShift;
export const getTemp = (packed: StaticVoxel): number => (packed & StaticVoxelTempMask) >> StaticVoxelTempShift;
export const getType = (packed: StaticVoxel): number => (packed & StaticVoxelTypeMask) >> StaticVoxelTypeShift;

export const setBond = (packed: StaticVoxel, bond: StaticVoxelBond, value: boolean): StaticVoxel => value ? packed & ~bond : packed | bond;
export const setDamage = (packed: StaticVoxel, damage: number): StaticVoxel => (packed & ~StaticVoxelDamageMask) | (damage << StaticVoxelDamageShift);
export const setTemp = (packed: StaticVoxel, temp: number): StaticVoxel => (packed & ~StaticVoxelTempMask) | (temp << StaticVoxelTempShift);
export const setType = (packed: StaticVoxel, type: number): StaticVoxel => (packed & ~StaticVoxelTypeMask) | (type << StaticVoxelTypeShift);

export const toDebugStaticVoxel = (packed: StaticVoxel) => {
    const bond = getBond(packed, StaticVoxelUnbondX);
    const damage = getDamage(packed);
    const temp = getTemp(packed);
    const type = getType(packed);
    return { bond, damage, temp, type };
}

// Flags, Damage, Temp, Type
//  This would be 4 times the data
