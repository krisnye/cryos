
struct VertexInput {
    @location(0) position: vec3<f32>,
    @location(1) normal: vec3<f32>,
    @location(2) texcoord: vec2<f32>,
};

struct VertexOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) worldPosition: vec3<f32>,
    @location(1) texcoord: vec2<f32>,
};

struct Camera {
    viewProjection: mat4x4<f32>,
    position: vec4<f32>,
};

@group(0) @binding(0)
var<uniform> camera: Camera;
@group(0) @binding(1)
var<uniform> model: mat4x4<f32>;

@group(1) @binding(0)
var colorSampler: sampler;
@group(1) @binding(1)
var colorTexture: texture_2d<f32>;

@vertex
fn vertex_main(vert: VertexInput) -> VertexOutput {
    var out: VertexOutput;
    out.position = camera.viewProjection * model * vec4<f32>(vert.position, 1.0);
    out.worldPosition = vert.position.xyz;
    out.texcoord = vert.texcoord;
    return out;
};

@fragment
fn fragment_main(in: VertexOutput) -> @location(0) vec4<f32> {
    let color = textureSample(colorTexture, colorSampler, in.texcoord);
    // return color;

    return vec4<f32>(in.worldPosition.x, in.worldPosition.y, 0, 1) + color;
    // let dx = dpdx(in.worldPosition);
    // let dy = dpdy(in.worldPosition);
    // let n = normalize(cross(dx, dy));
    // return vec4<f32>((n + 1.0) * 0.5, 0.5) + color;
}
