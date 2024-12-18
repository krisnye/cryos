
struct VertexInput {
    // The builtin position attribute is passed the transformed position
    @location(0) position: vec4<f32>,
    @location(1) texcoord: vec2<f32>,
}

@group(0) @binding(0) var ourSampler: sampler;
@group(0) @binding(1) var ourTexture: texture_2d<f32>;

struct VertexOutput {
    // The builtin position attribute is passed the transformed position
    @builtin(position) position: vec4<f32>,
    @location(0) texcoord: vec2<f32>,
};

@vertex
fn vertex_main(vert: VertexInput) -> VertexOutput {
    var out: VertexOutput;
    out.position = vert.position;
    out.texcoord = vert.texcoord;
    return out;
};

@fragment
fn fragment_main(in: VertexOutput) -> @location(0) vec4<f32> {
    return textureSample(ourTexture, ourSampler, in.texcoord);
}
