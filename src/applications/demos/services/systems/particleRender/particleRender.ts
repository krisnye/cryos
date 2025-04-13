import { TypedBuffer } from "../../../../../data/buffers";
import { getStructLayout } from "../../../../../data/buffers/structs/getStructLayout";
import { createStructGPUBuffer } from "../../../../../data/graphics/createStructGPUBuffer";
import { copyToGPUBuffer } from "../../../../../data/TypedArray/copyToGPUBuffer";
import { Particle, ParticleSchema } from "../../../types/Particle";
import { StateService } from "../../StateService";
import { Systems } from "../Systems";
import shaderSource from './particles.wgsl?raw';

export const createParticleRender = (db: StateService): Systems => {
    // Create particles buffer
    const { device, context } = db.resources;

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

    return {
        name: "particleRender",
        update(commandEncoder: GPUCommandEncoder) {
            particlesBuffer = copyToGPUBuffer(
                db.archetypes.particles.columns.particle as TypedBuffer<Particle, Float32Array>,
                device,
                particlesBuffer,
                particleLayout.size * db.archetypes.particles.rows
            );
        },
        render(renderPassEncoder: GPURenderPassEncoder) {
            const bindGroup = device.createBindGroup({
                layout: bindGroupLayout,
                entries: [
                    { binding: 0, resource: { buffer: db.resources.sceneBuffer } },
                    { binding: 1, resource: { buffer: particlesBuffer } }
                ]
            });

            renderPassEncoder.setPipeline(pipeline);
            renderPassEncoder.setBindGroup(0, bindGroup);
            renderPassEncoder.draw(36, db.archetypes.particles.rows, 0, 0); // 36 vertices (12 triangles), 1 instance per particle row
        }
    };
}