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
        uniforms: ShaderUniformValues<T>;
        resources: ShaderResourceValues<T>;
        workgroupCount: [number, number, number];
    }) => ComputeCommand<T>,
}

export function getComputeShader<T extends ComputeShaderDescriptor>(context: Context, descriptor: T): ComputeShader<T> {
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
        descriptor,
        dispatch: (options: {
            uniforms: ShaderUniformValues<T>;
            resources: ShaderResourceValues<T>;
            workgroupCount: [number, number, number];
        }): ComputeCommand<T> => {
            // Create bind group helper
            const bindGroupHelper = createBindGroupHelper(device, descriptor, options.uniforms, options.resources);
            let workgroupCount = [...options.workgroupCount] as [number, number, number];

            return {
                uniforms: bindGroupHelper.uniforms,
                resources: bindGroupHelper.resources,
                get workgroupCount() {
                    return [...workgroupCount];
                },
                set workgroupCount(value: [number, number, number]) {
                    workgroupCount[0] = value[0];
                    workgroupCount[1] = value[1];
                    workgroupCount[2] = value[2];
                },
                compute: (computePass: GPUComputePassEncoder) => {
                    computePass.setPipeline(pipeline);
                    computePass.setBindGroup(0, bindGroupHelper.getBindGroup());
                    computePass.dispatchWorkgroups(
                        workgroupCount[0],
                        workgroupCount[1],
                        workgroupCount[2]
                    );
                },
                destroy: () => {
                    bindGroupHelper.destroy();
                }
            };
        }
    };
} 