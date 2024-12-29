import { NewSampleCanvas } from "../NewSampleCanvas.js"
import { GraphicShaderDescriptor, ComputeShaderDescriptor } from "../../types/shader-types.js"
import { getGraphicShader } from "../../create-graphic-shader.js";
import { getComputeShader } from "../../create-compute-shader.js";
import { createScalingMat4 } from "../../math/mat4-functions.js";
import { createStorageBuffer } from "../../functions/create-storage-buffer.js";

const computeShaderDescriptor = {
    type: "compute",
    uniforms: {
        angle: "f32"
    },
    storage: {
        positions: ["vec4", 4]
    },
    source: `
@compute @workgroup_size(4, 1, 1)
fn main(@builtin(global_invocation_id) id: vec3<u32>) {
    let index = id.x;
    let pos = positions[index];
    
    // Rotate position around Z axis
    let c = cos(uniforms.angle);
    let s = sin(uniforms.angle);
    positions[index] = vec4(
        pos.x * c - pos.y * s,
        pos.x * s + pos.y * c,
        pos.z,
        pos.w
    );
}
`
} as const satisfies ComputeShaderDescriptor;

const storageShaderDescriptor = {
    type: "graphic",
    attributes: {
        position: "vec4",
        color: "vec4"
    },
    uniforms: {
        viewProjection: "mat4x4",
    },
    storage: {
        positions: ["vec4", 4]
    },
    source: `
alias float4 = vec4<f32>;
struct VertexOutput {
    @builtin(position) position: float4,
    @location(0) color: float4,
};

@vertex
fn vertex_main(
    vert: VertexInput,
    @builtin(instance_index) instance: u32
) -> VertexOutput {
    var out: VertexOutput;
    out.color = vert.color;
    let instancePos = positions[instance];
    out.position = uniforms.viewProjection * (vert.position + instancePos);
    return out;
};

@fragment
fn fragment_main(in: VertexOutput) -> @location(0) float4 {
    return float4(in.color);
}
`
} as const satisfies GraphicShaderDescriptor;

export function NewCompute() {
    return NewSampleCanvas({
        create: async (c) => {
            const computeShader = getComputeShader(c, computeShaderDescriptor);
            const storageShader = getGraphicShader(c, storageShaderDescriptor);

            // Create compute buffer with initial data
            const computePositionsBuffer = createStorageBuffer(
                c.device,
                {
                    data: new Float32Array([
                        -0.6, -0.8, 0.0, 0.0,
                        -0.2, -0.2, 0.0, 0.0,
                        0.2, 0.2, 0.0, 0.0,
                        0.6, 0.4, 0.0, 0.0,
                    ]),
                    storage: true,
                    writable: true,
                    copyFrom: true,
                    copyTo: true,
                    label: "compute positions"
                }
            );

            // Create read-only buffer for vertex shader
            const renderPositionsBuffer = createStorageBuffer(
                c.device,
                {
                    data: new Float32Array(16), // 4 vec4s
                    storage: true,
                    writable: false,
                    copyTo: true,
                    label: "render positions"
                }
            );

            // Create readback buffer for debugging
            const readbackBuffer = c.device.createBuffer({
                size: 64, // 16 floats * 4 bytes
                usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
                label: "readback buffer"
            });

            // Set up compute command
            const compute = computeShader.dispatch({
                uniforms: { angle: 42 },
                resources: { positions: computePositionsBuffer.buffer },
                workgroupCount: [1, 1, 1]
            });

            // create a vertex buffer for our triangle
            const vertexBuffer = storageShader.createVertexBuffer(
                [
                    // position (vec4)                      color (vec4)
                    0.1, -0.1, 0, 1,                        1, 0, 0, 1,    // vertex 1
                    -0.1, -0.1, 0, 1,                       0, 1, 0, 1,    // vertex 2
                    0.0, 0.1, 0, 1,                         0, 0, 1, 1,    // vertex 3
                ]
            );

            // create a draw command for our triangle
            const draw = storageShader.draw({
                vertexBuffer,
                vertexCount: 3,
                instanceCount: 4,
                uniforms: {
                    viewProjection: createScalingMat4(0.5),
                },
                resources: {
                    positions: renderPositionsBuffer.buffer
                }
            });

            let frameCount = 0;

            return {
                update: async (commandEncoder: GPUCommandEncoder) => {                    
                    frameCount++;
                    compute.uniforms.angle = Math.sin(frameCount * 0.01) * 0.2;

                    // Run compute pass
                    const computePass = commandEncoder.beginComputePass();
                    compute.compute(computePass);
                    computePass.end();

                    // Copy compute output to render input
                    commandEncoder.copyBufferToBuffer(
                        computePositionsBuffer.buffer, 0,
                        renderPositionsBuffer.buffer, 0,
                        64  // 16 floats * 4 bytes
                    );

                    // commandEncoder.copyBufferToBuffer(
                    //     computePositionsBuffer.buffer, 0,
                    //     readbackBuffer, 0,
                    //     64
                    // );

                    // Let the frame complete normally
                    return frameCount <= 1000;
                },
                render: async (renderPass: GPURenderPassEncoder) => {
                    draw.draw(renderPass);
                },
                postRender: async () => {
                    // After first frame render, read back the results
                    // Wait for GPU to complete
                    // if (frameCount % 100 === 0) {
                    //     await c.device.queue.onSubmittedWorkDone();
                    //     await readbackBuffer.mapAsync(GPUMapMode.READ);
                    //     const data = new Float32Array(readbackBuffer.getMappedRange());
                    //     console.log(JSON.stringify([...data]));
                    //     readbackBuffer.unmap();
                    // }
                },
                destroy() {
                    vertexBuffer.destroy();
                    computePositionsBuffer.destroy();
                    renderPositionsBuffer.destroy();
                    readbackBuffer.destroy();
                    draw.destroy();
                    compute.destroy();
                }
            };
        }
    });
} 