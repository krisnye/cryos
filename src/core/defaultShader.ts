import { toWGSLStructBody } from "./functions.js";
import { GPUShaderDescriptor } from "./types.js";
import { positionColor } from "./vertexFormats.js";

export const defaultShader: GPUShaderDescriptor = {
    vertexInput: positionColor,
    shader: /* wgsl */ `

struct VertexInput ${toWGSLStructBody(positionColor)}

struct VertexOutput {
    // The builtin position attribute is passed the transformed position
    @builtin(position) position: vec4<f32>,
    // We can pass other attributes through as well
    @location(0) color: vec4<f32>,
};

@vertex
fn vertex_main(vert: VertexInput) -> VertexOutput {
    var out: VertexOutput;
    out.color = vert.color;
    out.position = vert.position;
    return out;
};

@fragment
fn fragment_main(in: VertexOutput) -> @location(0) vec4<f32> {
    return vec4<f32>(in.color);
}`
};
