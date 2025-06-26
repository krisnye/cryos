import { System } from "graphics/systems/system.js";
import { MainService } from "../create-main-service.js";
import shaderSource from './particles.wgsl?raw';
import { copyToGPUBuffer, getStructLayout } from "@adobe/data/typed-buffer";
import { ParticleSchema } from "samples/particles/types/Particle.js";
import { createStructGPUBuffer } from "graphics/create-struct-gpu-buffer.js";

export const copyParticlesToGPUBufferSystem = (main: MainService): System[] => {
    const particles = main.store.ensureArchetype(["id", "velocity", "particle"]);
    const { graphics: { device, context } } = main.database.resources;
    const { store } = main;

    const particleLayout = getStructLayout(ParticleSchema)!;
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

    return [{
        name: "copyParticlesToGPUBufferSystem",
        phase: "update",
        run: () => {
            particlesBuffer = copyToGPUBuffer(
                particles.columns.particle,
                device,
                particlesBuffer,
                particleLayout.size * particles.rows
            );
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
            renderPassEncoder.draw(36, particles.rows, 0, 0); // 36 vertices (12 triangles), 1 instance per particle row
        }
    }]
};
