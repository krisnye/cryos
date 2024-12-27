import { ComputeShaderDescriptor, ShaderResourceValues, ShaderUniformValues } from "./types/shader-types.js";
import { toShaderHeaderInputs } from "./functions/to-shader-header-inputs.js";
import { toBindGroupLayoutDescriptor } from "./functions/to-bind-group-layout-descriptor.js";
import { createBindGroupHelper } from "./functions/create-bind-group-helper.js";
import { Resource } from "./types/resource-types.js";
import { Mutable } from "./types/meta-types.js";

interface Context {
    device: GPUDevice;
}

export interface ComputeCommand<T extends ComputeShaderDescriptor> extends Resource {
    /**
     * Individual uniforms can be written to.
     */
    readonly uniforms: Mutable<ShaderUniformValues<T>>;
    /**
     * Individual resources can be written to.
     */
    readonly resources: Mutable<ShaderResourceValues<T>>;
    workgroupCount: [number, number, number];
    compute(computePass: GPUComputePassEncoder): void;
}

export type ComputeShader<T extends ComputeShaderDescriptor> = {
    descriptor: T,
    dispatch: (options: {
        uniforms?: Record<string, any>;
        resources?: Record<string, GPUBuffer>;
        workgroupCount?: [number, number, number];
    }) => ComputeCommand<T>,
}

export function getComputeShader(context: Context, descriptor: ComputeShaderDescriptor) {
    const { device } = context;
    
    // Generate header and get full shader source
    const header = toShaderHeaderInputs(descriptor);
    const code = header + descriptor.source;
    
    // Create shader module
    const shaderModule = device.createShaderModule({
        code,
        label: "compute shader"
    });

    // Create pipeline layout
    const bindGroupLayoutDescriptor = toBindGroupLayoutDescriptor(descriptor);
    const bindGroupLayout = device.createBindGroupLayout(bindGroupLayoutDescriptor);
    const pipelineLayout = device.createPipelineLayout({
        bindGroupLayouts: [bindGroupLayout],
    });

    // Create compute pipeline
    const pipeline = device.createComputePipeline({
        layout: pipelineLayout,
        compute: {
            module: shaderModule,
            entryPoint: "main",
        }
    });

    return {
        dispatch: (options: {
            uniforms?: Record<string, any>;
            resources?: Record<string, GPUBuffer>;
            workgroupCount?: [number, number, number];
        }) => {
            // Create bind group helper
            const bindGroupHelper = createBindGroupHelper(device, descriptor, options.uniforms ?? {}, options.resources ?? {});

            return {
                compute: (computePass: GPUComputePassEncoder) => {
                    computePass.setPipeline(pipeline);
                    computePass.setBindGroup(0, bindGroupHelper.getBindGroup());
                    computePass.dispatchWorkgroups(
                        options.workgroupCount?.[0] ?? 1,
                        options.workgroupCount?.[1] ?? 1,
                        options.workgroupCount?.[2] ?? 1
                    );
                },
                destroy: () => {
                    bindGroupHelper.destroy();
                }
            };
        }
    };
} 