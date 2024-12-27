import { NewSampleCanvas } from "../NewSampleCanvas.js"
import { GraphicShaderDescriptor } from "../../types/shader-types.js"
import { getGraphicShader } from "../../create-graphic-shader.js";
import { createScalingMat4 } from "../../math/mat4-functions.js";
import { createStorageBuffer } from "../../functions/create-storage-buffer.js";

const storageShaderDescriptor = {
    attributes: {
        position: "vec4",
        color: "vec4"
    },
    uniforms: {
        viewProjection: "mat4x4",
    },
    storage: {
        positions: ["vec3", 4]
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
    out.position = uniforms.viewProjection * (vert.position + vec4<f32>(instancePos, 0.0));
    return out;
};

@fragment
fn fragment_main(in: VertexOutput) -> @location(0) float4 {
    return float4(in.color);
}
`
} as const satisfies GraphicShaderDescriptor;

export function Storage() {
    return NewSampleCanvas({
        create: async (c) => {
            const storageShader = getGraphicShader(c, storageShaderDescriptor);

            // Create storage buffer with 4 vec3 positions
            const positionsBuffer = createStorageBuffer(
                c.device,
                new Float32Array([
                    -0.6, 0.0, 0.0,  // left
                    -0.2, 0.0, 0.0,  // center-left
                    0.2, 0.0, 0.0,   // center-right
                    0.6, 0.0, 0.0,   // right
                ]),
                { 
                    storage: true, 
                    writable: false,
                    label: "positions"
                }
            );

            // create a vertex buffer for our triangle.
            const vertexBuffer = storageShader.createVertexBuffer(
                [
                    // position (vec3 + 1 padding float)    color (vec4)
                    0.1, -0.1, 0, 1,                        1, 0, 0, 1,    // vertex 1
                    -0.1, -0.1, 0, 1,                       0, 1, 0, 1,    // vertex 2
                    0.0, 0.1, 0, 1,                         0, 0, 1, 1,    // vertex 3
                ]
            );

            // create a draw command for our triangle.
            const draw = storageShader.draw({
                vertexBuffer,
                vertexCount: 3,
                instanceCount: 4,
                uniforms: {
                    viewProjection: createScalingMat4(0.5),
                },
                resources: {
                    positions: positionsBuffer.buffer
                }
            });

            // return a render function and a destroy function.
            return {
                render(renderPass: GPURenderPassEncoder) {
                    draw.render(renderPass);
                },
                destroy() {
                    vertexBuffer.destroy();
                    positionsBuffer.destroy();
                    draw.destroy();
                }
            };
        }
    });
} 