import { System } from "graphics/systems/system.js";
import { MainService } from "../create-main-service.js";
import shaderSource from './particles.wgsl?raw';
import { createStructGPUBuffer } from "graphics/create-struct-gpu-buffer.js";
import { copyColumnToGPUBuffer } from "@adobe/data/table";
import { Vec3Schema } from "math/vec3/index.js";
import { Vec4Schema } from "math/vec4/index.js";
import { U32Schema } from "@adobe/data/schema";
import { createTypedBuffer } from "@adobe/data/typed-buffer";

export const copyParticlesToGPUBufferSystem = (main: MainService): System[] => {
    const { graphics: { device, context } } = main.database.resources;
    const { store } = main;

    const bufferSchemas = [
        ["position", Vec3Schema],
        ["color", Vec4Schema]
    ] as const;

    // Create bind group layout
    const bindGroupLayout = device.createBindGroupLayout({
        entries: [
            {
                binding: 0,
                visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
                buffer: { type: 'uniform' }
            },
            ...bufferSchemas.map(([name, schema], index) => ({
                binding: index + 1,
                visibility: GPUShaderStage.VERTEX,
                buffer: { type: 'read-only-storage' }
            }) as const),
            {
                binding: 3,
                visibility: GPUShaderStage.VERTEX,
                buffer: { type: 'read-only-storage' }
            }
        ]
    });

    // Create pipeline
    const pipeline = device.createRenderPipeline({
        layout: device.createPipelineLayout({
            bindGroupLayouts: [bindGroupLayout]
        }),
        vertex: {
            module: device.createShaderModule({ code: shaderSource }),
            entryPoint: 'vertexMain'
        },
        fragment: {
            module: device.createShaderModule({ code: shaderSource }),
            entryPoint: 'fragmentMain',
            targets: [{ format: context.getConfiguration()?.format! }]
        },
        primitive: {
            topology: 'triangle-list',
            cullMode: 'back'
        },
        depthStencil: {
            depthWriteEnabled: true,
            depthCompare: 'less-equal',
            format: 'depth24plus'
        }
    });

    const buffers = bufferSchemas.map(([name, schema]) => {
        return createStructGPUBuffer({
            device,
            schema,
            elements: [],
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
        });
    });

    // Create a typed buffer for flags
    let flagsTypedBuffer = createTypedBuffer({ schema: U32Schema, length: 1 });
    let flagsBuffer = device.createBuffer({
        size: 4, // Start with 4 bytes (1 u32)
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
    });

    // this is closed over by both systems, written by the first and read by the second
    let particleCount = 0;

    return [{
        name: "copyParticlesToGPUBufferSystem",
        phase: "update",
        run: () => {
            const particleTables = store.queryArchetypes(["id", "velocity", "position", "color", "flags", "particle"]);

            for (let i = 0; i < bufferSchemas.length; i++) {
                const [name, schema] = bufferSchemas[i];
                buffers[i] = copyColumnToGPUBuffer(
                    particleTables,
                    name,
                    device,
                    buffers[i]
                );
            }

            // Handle flags buffer using copyColumnToGPUBuffer
            flagsBuffer = copyColumnToGPUBuffer(
                particleTables,
                "flags",
                device,
                flagsBuffer
            );

            particleCount = particleTables.reduce((acc, table) => acc + table.rows, 0);
        }
    }, {
        name: "renderParticlesSystem",
        phase: "render",
        run: () => {
            const { renderPassEncoder } = main.database.resources;

            const bindGroup = device.createBindGroup({
                layout: bindGroupLayout,
                entries: [
                    { binding: 0, resource: { buffer: store.resources.sceneBuffer } },
                    ...buffers.map((buffer, index) => ({ binding: index + 1, resource: { buffer } }) as const),
                    { binding: 3, resource: { buffer: flagsBuffer } }
                ]
            });

            renderPassEncoder.setPipeline(pipeline);
            if (particleCount > 0) {
                renderPassEncoder.setBindGroup(0, bindGroup);
                renderPassEncoder.draw(36, particleCount, 0, 0); // 36 vertices (12 triangles), 1 instance per particle row
            }

            // let's also render out our chunks.
            const staticVoxelChunkTable = store.archetypes.StaticVoxelChunk;
            for (let i = 0; i < staticVoxelChunkTable.rows; i++) {
                const positions = staticVoxelChunkTable.columns.staticVoxelChunkPositionsBuffer.get(i);
                const colors = staticVoxelChunkTable.columns.staticVoxelChunkColorsBuffer.get(i);
                const flags = staticVoxelChunkTable.columns.staticVoxelChunkFlagsBuffer.get(i);
                let staticVoxelChunkBindGroup = staticVoxelChunkTable.columns.staticVoxelChunkBindGroup.get(i);
                if (staticVoxelChunkBindGroup === null) {
                    staticVoxelChunkBindGroup = device.createBindGroup({
                        layout: bindGroupLayout,
                        entries: [
                            { binding: 0, resource: { buffer: store.resources.sceneBuffer } },
                            { binding: 1, resource: { buffer: positions } },
                            { binding: 2, resource: { buffer: colors } },
                            { binding: 3, resource: { buffer: flags } },
                        ]
                    });
                    staticVoxelChunkTable.columns.staticVoxelChunkBindGroup.set(i, staticVoxelChunkBindGroup);
                }
                renderPassEncoder.setBindGroup(0, staticVoxelChunkBindGroup);
                const renderCount = staticVoxelChunkTable.columns.staticVoxelChunkRenderCount.get(i);
                renderPassEncoder.draw(36, renderCount, 0, 0); // 36 vertices (12 triangles), 1 instance per chunk chunk
            }
        }
    }]
};
