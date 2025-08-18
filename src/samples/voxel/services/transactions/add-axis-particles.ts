import { VoxelStore } from "../voxel-store.js";
import { AabbSchema } from "math/aabb/aabb.js";

export const addAxisParticles = (t: VoxelStore) => {
    // create a black particle right at the origin.
    t.archetypes.Particle.insert({
        position_scale: [0, 0, 0, 1],
        color: [0, 0, 0, 1],
        velocity: [0, 0, 0],
        flags: 0,
        boundingBox: AabbSchema.default,
        particle: true
    });
    
    // create a red particle for +X axis
    t.update(
        t.archetypes.Particle.insert({
            position_scale: [1, 0, 0, 1],
            color: [1, 0, 0, 1],
            velocity: [0, 0, 0],
            flags: 0,
            boundingBox: AabbSchema.default,
            particle: true,
        }),
        {
            label: "+X"
        }
    )
    
    // create a green particle for +Y axis
    t.update(
        t.archetypes.Particle.insert({
        position_scale: [0, 1, 0, 1],
        color: [0, 1, 0, 1],
        velocity: [0, 0, 0],
        flags: 0,
        boundingBox: AabbSchema.default,
        particle: true,
        }),
        {
            label: "+Y"
        }
    )
    
    // create a blue particle for +Z axis
    t.update(
        t.archetypes.Particle.insert({
        position_scale: [0, 0, 1, 1],
        color: [0, 0, 1, 1],
        velocity: [0, 0, 0],
        flags: 0,
        boundingBox: AabbSchema.default,
        particle: true,
        }),
        {
            label: "+Z"
        }
    )
}; 