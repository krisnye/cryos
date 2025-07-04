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
            for (let i = 0; i < 100; i++) {
                store.archetypes.Particle.insert({
                    position:  [Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1],
                    color: [Math.random(), Math.random(), Math.random(), 1],
                    velocity: VEC3.scale([Math.random() * 0.2 - 0.1, Math.random() * 0.2 - 0.1, Math.random() * 0.2 - 0.1], velocity),
                    boundingBox: AabbSchema.default,
                    particle: true
                })
            }

            // create a few adjacent chunks
            const size = 4;
            for (let i = -1; i < 2; i++) {
                const position: Vec2 = [i * size, 0];
                const chunk = createRandomStaticVoxelChunk(size, position);
                store.archetypes.StaticVoxelChunk.insert({
                    staticVoxelChunk: chunk,
                    position: [...position, 0],
                    staticVoxelChunkPositionsBuffer: store.resources.graphics.device.createBuffer({
                        size: 0, // we will update the size later
                        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
                    }),
                    staticVoxelChunkColorsBuffer: store.resources.graphics.device.createBuffer({
                        size: 0, // we will update the size later
                        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
                    }),
                    staticVoxelChunkRenderCount: 0,
                });
            }
        }
    })
};
