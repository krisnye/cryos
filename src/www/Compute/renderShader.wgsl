alias float4 = vec4<f32>;

struct VertexInput {
    // The builtin position attribute is passed the transformed position
    @location(0) position: float4,
    // We can pass other attributes through as well
    @location(1) color: float4,
    // Instancing index
    @builtin(instance_index) instance: u32,
}
struct VertexOutput {
    // The builtin position attribute is passed the transformed position
    @builtin(position) position: float4,
    // We can pass other attributes through as well
    @location(0) color: float4,
};

// New: define a struct that contains the data we want to pass
// through the uniform buffer
struct ViewParams {
    view_proj: mat4x4<f32>,
    width: u32,
};

// New: create a uniform variable of our struct type
// and assign it group and binding indices
@group(0) @binding(0)
var<uniform> view_params: ViewParams;

@group(0) @binding(1)
var<storage, read> cells: array<u32>;

const width = {{inject_width}}f;    //  TODO: Uniform.

@vertex
fn vertex_main(vert: VertexInput) -> VertexOutput {
    var out: VertexOutput;
    out.color = vert.color;
    var x = f32(vert.instance % u32(width));
    var y = f32(vert.instance / u32(width));
    var alive = cells[vert.instance];
    if (alive == 0) {
        out.position = vec4(1000, 1000, 1000, 1);
    }
    else {
        out.position = view_params.view_proj * (vert.position + vec4(x, y, 0, 0));
    }
    return out;
};

@fragment
fn fragment_main(in: VertexOutput) -> @location(0) float4 {
    return float4(in.color);
}