import { VoxelStore } from "../voxel-store.js";
import { AabbSchema } from "math/aabb/aabb.js";
import * as VEC3 from "math/vec3/index.js";

export const addRandomParticles = (t: VoxelStore, count: number) => {
    // add N random particles positioned from -1 to +1
    // and with random velocity
    const velocity = 0.5;
    const center: VEC3.Vec3 = [8, 8, 8];
    for (let i = 0; i < count; i++) {
        const scale = Math.random() * 0.5 + 0.5;
        const position = VEC3.add(center, VEC3.scale([Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1], scale));
        t.archetypes.Particle.insert({
            position_scale: [...position, scale],
            color: [Math.random(), Math.random(), Math.random(), 1],
            velocity: VEC3.scale([Math.random() * 0.2 - 0.1, Math.random() * 0.2 - 0.1, Math.random() * 0.2 - 0.1], velocity),
            flags: 0,
            boundingBox: AabbSchema.default,
            material: t.resources.materials.meta.index,
            particle: true
        });
    }
}; 