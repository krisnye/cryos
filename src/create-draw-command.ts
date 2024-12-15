import { InternalDrawCommand } from "./create-context.js";
import { EmptyToNever } from "./types/meta-types.js";
import { GraphicShaderDescriptor, ShaderUniformValues, ShaderResourceValues, ShaderVertexBuffer } from "./types/shader-types.js";

export function createDrawCommand<T extends GraphicShaderDescriptor>(
    shaderName: string,
    renderPipeline: GPURenderPipeline,
    props: {
        uniforms: EmptyToNever<ShaderUniformValues<T>>;
        resources: EmptyToNever<ShaderResourceValues<T>>;
        vertexBuffer: ShaderVertexBuffer<T>;
        vertexCount: number;
        instanceCount?: number;
    }
): InternalDrawCommand<T> {
    return {
        shaderName,
        ...props,
        resources: props.resources as any,
        encodeCommands: (encoder: GPUCommandEncoder) => {
        },
        encodeDrawCommands: (pass: GPURenderPassEncoder) => {
            // const state = bindGroupCache.get(renderPipeline);
            // if (!state) {
            //     throw new Error("Bind group state not initialized");
            // }

            // pass.setPipeline(renderPipeline);
            // pass.setBindGroup(0, state.bindGroup);
            // pass.setVertexBuffer(0, props.vertexBuffer);
            // pass.draw(props.vertexCount, props.instanceCount ?? 1);
        }
    };
}
