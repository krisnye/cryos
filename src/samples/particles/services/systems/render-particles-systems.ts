import { System } from "graphics/systems/system.js";
import { MainService } from "../create-main-service.js";
import shaderSource from './particles.wgsl?raw';
import { ParticleSchema } from "samples/particles/types/particle/particle.js";
import { createStructGPUBuffer } from "graphics/create-struct-gpu-buffer.js";
import { copyColumnToGPUBuffer } from "@adobe/data/table";

export const copyParticlesToGPUBufferSystem = (main: MainService): System[] => {
    const { graphics: { device, context } } = main.database.resources;
    const { store } = main;

    let particlesBuffer = createStructGPUBuffer({
        device,
        schema: ParticleSchema,
        elements: [],
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
    });

    // Create bind group layout
    const bindGroupLayout = device.createBindGroupLayout({
        entries: [
            {
                binding: 0,
                visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
                buffer: { type: 'uniform' }
            },
            {
                binding: 1,
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
            depthCompare: 'less',
            format: 'depth24plus'
        }
    });

    // this is closed over by both systems, written by the first and read by the second
    let particleCount = 0;

    return [{
        name: "copyParticlesToGPUBufferSystem",
        phase: "update",
        run: () => {
            const particleTables = store.queryArchetypes(["id", "velocity", "particle"]);
            particlesBuffer = copyColumnToGPUBuffer(
                particleTables,
                "particle",
                device,
                particlesBuffer
            );
            particleCount = particleTables.reduce((acc, table) => acc + table.rowCount, 0);
        }
    },{
        name: "renderParticlesSystem",
        phase: "render",
        run: () => {
            const { renderPassEncoder } = main.database.resources;
            const bindGroup = device.createBindGroup({
                layout: bindGroupLayout,
                entries: [
                    { binding: 0, resource: { buffer: store.resources.sceneBuffer } },
                    { binding: 1, resource: { buffer: particlesBuffer } }
                ]
            });

            renderPassEncoder.setPipeline(pipeline);
            renderPassEncoder.setBindGroup(0, bindGroup);
            renderPassEncoder.draw(36, particleCount, 0, 0); // 36 vertices (12 triangles), 1 instance per particle row
        }
    }]
};
