import { System } from "graphics/systems/system.js";
import { MainService } from "../create-main-service.js";
import { withRunOnce } from "graphics/systems/with-run-once.js";
import * as VEC3 from "math/vec3/index.js";import * as VEC4 from "math/vec4/index.js";
import { AabbSchema } from "math/aabb/aabb.js";
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
                const scale = Math.random() * 0.5 + 0.5;
                store.archetypes.Particle.insert({
                    position_scale: [Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1, scale],
                    color: [Math.random(), Math.random(), Math.random(), 1],
                    velocity: VEC3.scale([Math.random() * 0.2 - 0.1, Math.random() * 0.2 - 0.1, Math.random() * 0.2 - 0.1], velocity),
                    flags: 0,
                    boundingBox: AabbSchema.default,
                    particle: true
                })
            }
            // create a black particle right at the origin.
            store.archetypes.Particle.insert({
                position_scale: [0, 0, 0, 1],
                color: [0, 0, 0, 1],
                velocity: [0, 0, 0],
                flags: 0,
                boundingBox: AabbSchema.default,
                particle: true
            })
            // create a red particle right at the origin.
            store.archetypes.Particle.insert({
                position_scale: [1, 0, 0, 1],
                color: [1, 0, 0, 1],
                velocity: [0, 0, 0],
                flags: 0,
                boundingBox: AabbSchema.default,
                particle: true
            })
            // create a green particle above at the origin.
            store.archetypes.Particle.insert({
                position_scale: [0, 1, 0, 1],
                color: [0, 1, 0, 1],
                velocity: [0, 0, 0],
                flags: 0,
                boundingBox: AabbSchema.default,
                particle: true
            })
            // create a blue particle above at the origin.
            store.archetypes.Particle.insert({
                position_scale: [0, 0, 1, 1],
                color: [0, 0, 1, 1],
                velocity: [0, 0, 0],
                flags: 0,
                boundingBox: AabbSchema.default,
                particle: true
            })

            // create a few adjacent chunks
            const size = 16;
            const radius = 15;
            for (let x = -radius; x < radius; x++) {
                for (let y = -radius; y < radius; y++) {
                    if (x === 0 && y === 0) {
                        continue;
                    }
                    const position: VEC3.Vec3 = [x * size, y * size, -4];
                    const chunk = createRandomStaticVoxelChunk(size, [x, y]);
                    store.archetypes.StaticVoxelChunk.insert({
                        staticVoxelChunk: chunk,
                        position,
                        staticVoxelChunkPositionsBuffer: store.resources.graphics.device.createBuffer({
                            size: 0, // we will update the size later
                            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
                        }),
                        staticVoxelChunkColorsBuffer: store.resources.graphics.device.createBuffer({
                            size: 0, // we will update the size later
                            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
                        }),
                        staticVoxelChunkFlagsBuffer: store.resources.graphics.device.createBuffer({
                            size: 0, // we will update the size later
                            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
                        }),
                        staticVoxelChunkRenderCount: 0,
                        dirtyFrame: store.resources.renderFrame.count,
                        cleanFrame: -1,
                        staticVoxelChunkBindGroup: null as unknown as GPUBindGroup,
                    });
                }
            }
        }
    })
};
