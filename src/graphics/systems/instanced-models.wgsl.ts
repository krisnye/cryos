// Instanced model rendering shader
// Based on the voxel rendering approach but adapted for instanced vertex buffers

export default `
// Instanced model rendering shader
// Based on the voxel rendering approach but adapted for instanced vertex buffers

struct SceneUniforms {
    viewProjectionMatrix: mat4x4<f32>,
    lightDirection: vec3<f32>,
    ambientStrength: f32,
    lightColor: vec3<f32>,
}

struct InstanceData {
    @location(4) instancePosition: vec3<f32>,
    @location(5) instanceScale: vec3<f32>,
    @location(6) instanceRotation: vec4<f32>,
}

@group(0) @binding(0) var<uniform> scene: SceneUniforms;

// Rotate a vector by a quaternion
// q is quaternion (x, y, z, w), v is the vector to rotate
fn rotateByQuaternion(v: vec3<f32>, q: vec4<f32>) -> vec3<f32> {
    let qxyz = vec3<f32>(q.x, q.y, q.z);
    let t = 2.0 * cross(qxyz, v);
    return v + q.w * t + cross(qxyz, t);
}

// Compute inverse quaternion (for unit quaternions, inverse = conjugate)
fn inverseQuaternion(q: vec4<f32>) -> vec4<f32> {
    return vec4<f32>(-q.x, -q.y, -q.z, q.w);
}

struct VertexOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) color: vec4<f32>,
    @location(1) worldPosition: vec3<f32>,
    @location(2) normal: vec3<f32>,
    @location(3) @interpolate(flat) instanceId: u32,
}

@vertex
fn vertexMain(
    @location(0) vertexPosition: vec3<f32>,
    @location(1) vertexColor: vec4<f32>,
    @location(2) vertexNormal: vec3<f32>,
    @location(4) instancePosition: vec3<f32>,
    @location(5) instanceScale: vec3<f32>,
    @location(6) instanceRotation: vec4<f32>,
    @builtin(instance_index) instanceId: u32,
) -> VertexOutput {
    // Apply instance transform: scale -> rotate -> translate
    let scaledVertex = vertexPosition * instanceScale;
    let rotatedVertex = rotateByQuaternion(scaledVertex, instanceRotation);
    let worldPosition = rotatedVertex + instancePosition;
    
    // Transform normal to world space (simpler approach)
    let worldNormal = rotateByQuaternion(vertexNormal, instanceRotation);
    
    var output: VertexOutput;
    output.position = scene.viewProjectionMatrix * vec4<f32>(worldPosition, 1.0);
    output.color = vertexColor;
    output.worldPosition = worldPosition;
    output.normal = worldNormal; // Transform to world space
    output.instanceId = instanceId;
    return output;
}

struct FragmentOutput {
    @location(0) color: vec4<f32>,
}

@fragment
fn fragmentMain(input: VertexOutput) -> FragmentOutput {
    // Discard fully transparent fragments to avoid depth writes
    if (input.color.a <= 0.0) {
        discard;
    }
    
    // Normalize vectors
    let N = normalize(input.normal);
    let L = normalize(-scene.lightDirection);
    
    // Ambient lighting
    let ambient = scene.ambientStrength;
    
    // Diffuse lighting (Lambert)
    let diffuse = max(dot(N, L), 0.0);
    
    // Combine lighting
    let lighting = ambient + diffuse;
    
    // Apply lighting to color (but preserve alpha)
    let finalColor = vec4<f32>(
        input.color.rgb * lighting * scene.lightColor,
        input.color.a
    );
    
    return FragmentOutput(finalColor);
}
`;
