import { System } from "graphics/systems/system.js";
import { MainService } from "../create-main-service.js";
import { withRunOnce } from "graphics/systems/with-run-once.js";
import * as VEC3 from "math/vec3/index.js";
import { AabbSchema } from "math/aabb/aabb.js";
import { Vec2 } from "math/index.js";
import { createRandomStaticVoxelChunk } from "samples/voxel/types/static-voxel-chunk/create-random-static-voxel-chunk.js";

export const initializeParticlesSystem = ({ store }: MainService): System => {
    return withRunOnce({
        name: "initializeParticlesSystem",
        phase: "update",
        run: () => {
            // add 100 random particles positioned from -1 to +1
            // and with random velocity
            const velocity = 0.2;
            for (let i = 0; i < 10; i++) {
                store.archetypes.Particle.insert({
                    position:  [Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1],
                    color: [Math.random(), Math.random(), Math.random(), 1],
                    velocity: VEC3.scale([Math.random() * 0.2 - 0.1, Math.random() * 0.2 - 0.1, Math.random() * 0.2 - 0.1], velocity),
                    boundingBox: AabbSchema.default,
                    particle: true
                })
            }
            // create a black particle right at the origin.
            store.archetypes.Particle.insert({
                position: [0, 0, 0],
                color: [0, 0, 0, 1],
                velocity: [0, 0, 0],
                boundingBox: AabbSchema.default,
                particle: true
            })
            // create a red particle right at the origin.
            store.archetypes.Particle.insert({
                position: [1, 0, 0],
                color: [1, 0, 0, 1],
                velocity: [0, 0, 0],
                boundingBox: AabbSchema.default,
                particle: true
            })
            // create a green particle above at the origin.
            store.archetypes.Particle.insert({
                position: [0, 1, 0],
                color: [0, 1, 0, 1],
                velocity: [0, 0, 0],
                boundingBox: AabbSchema.default,
                particle: true
            })
            // create a blue particle above at the origin.
            store.archetypes.Particle.insert({
                position: [0, 0, 1],
                color: [0, 0, 1, 1],
                velocity: [0, 0, 0],
                boundingBox: AabbSchema.default,
                particle: true
            })

            // create a few adjacent chunks
            // const size = 4;
            // for (let i = -1; i < 2; i++) {
            //     const position: VEC3.Vec3 = [i * size, 0, -4];
            //     const chunk = createRandomStaticVoxelChunk(size, [position[0], position[1]]);
            //     store.archetypes.StaticVoxelChunk.insert({
            //         staticVoxelChunk: chunk,
            //         position,
            //         staticVoxelChunkPositionsBuffer: store.resources.graphics.device.createBuffer({
            //             size: 0, // we will update the size later
            //             usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
            //         }),
            //         staticVoxelChunkColorsBuffer: store.resources.graphics.device.createBuffer({
            //             size: 0, // we will update the size later
            //             usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
            //         }),
            //         staticVoxelChunkRenderCount: 0,
            //     });
            // }
        }
    })
};
