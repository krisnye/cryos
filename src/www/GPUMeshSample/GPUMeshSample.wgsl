
struct VertexInput {
    @location(0) position: vec3<f32>,
    @location(1) normal: vec3<f32>,
    @location(2) texcoord: vec2<f32>,
};

struct VertexOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) worldPosition: vec3<f32>,
    @location(1) normal: vec3<f32>,
    @location(2) texcoord: vec2<f32>,
};

struct BasicUniforms {
    ambientLightColor: vec4<f32>,
    viewProjectionMatrix: mat4x4<f32>,
    cameraPosition: vec3<f32>,
    directionalLightColor: vec4<f32>,
    directionalLightDirection: vec3<f32>,
};

@group(0) @binding(0)
var<uniform> uniforms: BasicUniforms;
@group(0) @binding(1)
var<uniform> modelMatrix: mat4x4<f32>;

@group(1) @binding(0)
var colorSampler: sampler;
@group(1) @binding(1)
var colorTexture: texture_2d<f32>;

@vertex
fn vertex_main(vert: VertexInput) -> VertexOutput {
    var out: VertexOutput;
    out.position = uniforms.viewProjectionMatrix * modelMatrix * vec4<f32>(vert.position, 1.0);
    out.worldPosition = vert.position.xyz;
    out.texcoord = vert.texcoord;
    out.normal = vert.normal;
    return out;
};

fn directionToColor(in: vec3<f32>) -> vec4<f32> {
    return vec4<f32>((in + 1) / 2.0, 1.0);
}

@fragment
fn fragment_main(in: VertexOutput) -> @location(0) vec4<f32> {
    let diffuseColor = textureSample(colorTexture, colorSampler, in.texcoord);
    let ambientComponent = diffuseColor.rgb * uniforms.ambientLightColor.rgb;
    let diffuseMagnitude = clamp(dot(in.normal, uniforms.directionalLightDirection), 0.0, 1.0);
    let diffuseComponent = diffuseColor.rgb * uniforms.directionalLightColor.rgb * diffuseMagnitude;
    return vec4(ambientComponent + diffuseComponent, 1.0);
}
