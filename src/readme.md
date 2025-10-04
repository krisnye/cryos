
position: Vec3
rotation: Quat4
scale: Vec3

material: U32
temperature: F32
damage: F32
voxelParticle: True

    or

voxelModelId: Entity


type VoxelModel =
    center: Vec3
    color?: Volume<ARGB: U32>

    structure?: Volume<{ material: U32, temperature: F32, damage: F32 }>

type MaterialType =
    density: F32
    viscosity: F32
    specificHeatCapacity: F32
    thermalConductivity: F32
    color: Vec4
