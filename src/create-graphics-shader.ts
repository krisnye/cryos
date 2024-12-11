import { createVertexBuffer } from "./create-vertex-buffer.js";
import { toBindGroupLayoutDescriptor } from "./functions/to-bind-group-layout-descriptor.js";
import { toGPUVertexBufferLayout } from "./functions/index.js";
import { toShaderHeaderInputs } from "./functions/to-shader-header-inputs.js";
import { DrawCommand, GraphicShader } from "./types/context-types.js";
import { EmptyToNever } from "./types/meta-types.js";
import { VertexAttributes, VertexBuffer } from "./types/resource-types.js";
import { GraphicShaderDescriptor, ShaderResourceValues, ShaderVertexBuffer } from "./types/shader-types.js";

export interface InternalGraphicsShader<T extends GraphicShaderDescriptor> extends GraphicShader<T> {
    renderPipeline: GPURenderPipeline;
    //  these are used for caching
    //  We only have to recreate the bind group if sampler, storage or texture changes.
    //  If uniforms chnage we only have to update the GPUBuffer.
    uniformBuffer?: GPUBuffer;
    lastBindGroup?: GPUBindGroup;
    lastShaderResources?: ShaderResourceValues<T>;
}

export function createGraphicsShader<T extends GraphicShaderDescriptor>(
    { device, targetFormat, shaderName, descriptor }: {
        device: GPUDevice,
        targetFormat: GPUTextureFormat,
        shaderName: string,
        descriptor: T
    }
): InternalGraphicsShader<T> {
    const code = toShaderHeaderInputs(descriptor) + descriptor.source;
    const vertexBufferLayout = descriptor.attributes ? toGPUVertexBufferLayout(descriptor.attributes) : undefined;
    const module = device.createShaderModule({ code });
    const layout = device.createPipelineLayout({
        bindGroupLayouts: [
            device.createBindGroupLayout(
                toBindGroupLayoutDescriptor(descriptor)
            )
        ]
    });
    const shader = {
        descriptor,
        renderPipeline: device.createRenderPipeline({
            layout,
            vertex: {
                module,
                entryPoint: "vertex_main",
                buffers: vertexBufferLayout ? [vertexBufferLayout] : [],
            },
            fragment: {
                module,
                entryPoint: "fragment_main",
                targets: [
                    {
                        format: targetFormat,
                    },
                ],
            },
            primitive: {
                topology: "triangle-list",
            },
        }),
        draw: (
            resources: EmptyToNever<ShaderResourceValues<T>>,
            vertexBuffer: ShaderVertexBuffer<T>,
            vertexCount: number,
            instanceCount?: number
        ): DrawCommand<T> => {
            return { shaderName, resources: resources as any, vertexBuffer, vertexCount, instanceCount };
        },
        createVertexBuffer: (descriptor.attributes ? (data) => {
            return createVertexBuffer(device, descriptor.attributes!, data) as ShaderVertexBuffer<T>;
        } : undefined) as any,
    } satisfies InternalGraphicsShader<T>;
    return shader;
}