import { VoxelStore } from "../voxel-store.js";
import { AabbSchema } from "math/aabb/aabb.js";
import { SELECTED_MASK } from "../../types/flags.js";

export const addWalls = (t: VoxelStore, args: { length: number }) => {
    const { length } = args;
    // Create 3 walls/floors extending from origin
    // Each wall is a grid of particles with spacing of 0.5 units
    
    const spacing = 1.0;
    const size = 1.0;
    
    // X-direction wall (YZ plane at x=0)
    for (let y = 1; y < length; y++) {
        for (let z = 1; z < length; z++) {
            // Select every 3rd particle in the X wall
            const isSelected = (y + z) % 3 === 0;
            t.archetypes.Particle.insert({
                position_scale: [0, y * spacing, z * spacing, size],
                color: t.resources.materials.meta.color,
                velocity: [0, 0, 0], // Static wall
                flags: isSelected ? SELECTED_MASK : 0,
                boundingBox: AabbSchema.default,
                material: t.resources.materials.meta.index,
                particle: true
            });
        }
    }
    
    // Y-direction wall (XZ plane at y=0)
    for (let x = 1; x < length; x++) {
        for (let z = 1; z < length; z++) {
            // Select every 4th particle in the Y wall
            const isSelected = (x + z) % 4 === 0;
            t.archetypes.Particle.insert({
                position_scale: [x * spacing, 0, z * spacing, size],
                color: t.resources.materials.meta.color,
                velocity: [0, 0, 0], // Static wall
                flags: isSelected ? SELECTED_MASK : 0,
                boundingBox: AabbSchema.default,
                material: t.resources.materials.meta.index,
                particle: true
            });
        }
    }
    
    // Z-direction wall (XY plane at z=0)
    for (let x = 1; x < length; x++) {
        for (let y = 1; y < length; y++) {
            // Select every 5th particle in the Z wall
            const isSelected = (x + y) % 5 === 0;
            t.archetypes.Particle.insert({
                position_scale: [x * spacing, y * spacing, 0, size],
                material: t.resources.materials.meta.index,
                velocity: [0, 0, 0], // Static wall
                flags: isSelected ? SELECTED_MASK : 0,
                boundingBox: AabbSchema.default,
                color: t.resources.materials.meta.color,
                particle: true
            });
        }
    }
}; 