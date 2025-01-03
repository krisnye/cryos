import { NewSampleCanvas } from "../NewSampleCanvas.js"
import { GraphicShaderDescriptor } from "../../types/shader-types.js"
import { getGraphicShader } from "../../create-graphic-shader.js";
import { createScalingMat4 } from "../../math/mat4-functions.js";

const instancingShaderDescriptor = {
    type: "graphic",
    attributes: {
        position: "vec4",
        color: "vec4"
    },
    uniforms: {
        viewProjection: "mat4x4",
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
    out.position = uniforms.viewProjection * vert.position + vec4(-0.45f + 0.1f * f32(instance), 0, 0, 0);
    return out;
};

@fragment
fn fragment_main(in: VertexOutput) -> @location(0) float4 {
    return float4(in.color);
}
`
} as const satisfies GraphicShaderDescriptor;

export function Instancing() {
    return NewSampleCanvas({
        create: async (c) => {
            const instancingShader = getGraphicShader(c, instancingShaderDescriptor);

            // create a vertex buffer for our triangle.
            const vertexBuffer = instancingShader.createVertexBuffer(
                [
                    // position (vec3 + 1 padding float)    color (vec4)
                    1, -1, 0, 1,                            1, 0, 0, 1,    // vertex 1
                    -1, -1, 0, 1,                           0, 1, 0, 1,    // vertex 2
                    0, 1, 0, 1,                             0, 0, 1, 1,    // vertex 3
                ]
            );

            // create a draw command for our triangle.
            const draw = instancingShader.draw({
                vertexBuffer,
                vertexCount: 3,
                instanceCount: 10,
                uniforms: {
                    viewProjection: createScalingMat4(0.5),
                },
            });

            // return a render function and a destroy function.
            return {
                render(renderPass: GPURenderPassEncoder) {
                    draw.draw(renderPass);
                },
                destroy() {
                    vertexBuffer.destroy();
                    draw.destroy();
                }
            };
        }
    });
}
