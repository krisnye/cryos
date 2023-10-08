
alias float4 = vec4<f32>;

struct VertexInput {
    // The builtin position attribute is passed the transformed position
    @location(0) position: float4,
    // We can pass other attributes through as well
    @location(1) color: float4,
}

struct VertexOutput {
    // The builtin position attribute is passed the transformed position
    @builtin(position) position: float4,
    // We can pass other attributes through as well
    @location(0) color: float4,
};

@vertex
fn vertex_main(vert: VertexInput) -> VertexOutput {
    var out: VertexOutput;
    out.color = vert.color;
    out.position = vert.position;
    return out;
};

@fragment
fn fragment_main(in: VertexOutput) -> @location(0) float4 {
    return float4(in.color);
}
