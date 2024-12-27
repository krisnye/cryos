import { NewSampleCanvas } from "../NewSampleCanvas.js"
import { GraphicShaderDescriptor } from "../../types/shader-types.js"
import { getGraphicShader } from "../../create-graphic-shader.js";

const triangleShaderDescriptor = {
    attributes: {
        position: "vec3", // this is padded to a vec4
        color: "vec4"
    },
    source: `
alias float4 = vec4<f32>;
struct VertexOutput {
    @builtin(position) position: float4,
    @location(0) color: float4,
};

@vertex
fn vertex_main(vert: VertexInput) -> VertexOutput {
    var out: VertexOutput;
    out.color = vert.color;
    out.position = float4(vert.position, 1.0);
    return out;
};

@fragment
fn fragment_main(in: VertexOutput) -> @location(0) float4 {
    return float4(in.color);
}
`
} as const satisfies GraphicShaderDescriptor;

export function FirstTriangle() {
    return NewSampleCanvas({
        create: async (c) => {
            const triangleShader = getGraphicShader(c, triangleShaderDescriptor);

            // create a vertex buffer for our triangle.
            const vertexBuffer = triangleShader.createVertexBuffer(
                [
                    // position (vec3 + 1 padding float)    color (vec4)
                    1, -1, 0, 0,                            1, 0, 0, 1,    // vertex 1
                    -1, -1, 0, 0,                           0, 1, 0, 1,    // vertex 2
                    0, 1, 0, 0,                             0, 0, 1, 1,    // vertex 3
                ]
            );

            // create a draw command for our triangle.
            const draw = triangleShader.draw({
                vertexBuffer,
                vertexCount: 3,
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
