// Voxel rendering shader
// Based on the particle rendering approach but adapted for voxels

export default `
// Voxel rendering shader
// Based on the particle rendering approach but adapted for voxels

struct SceneUniforms {
    viewProjectionMatrix: mat4x4<f32>,
    lightDirection: vec3<f32>,
    ambientStrength: f32,
    lightColor: vec3<f32>,
}


// Vertex data for a cube (12 triangles, 36 vertices)
const CUBE_VERTICES: array<vec3<f32>, 36> = array<vec3<f32>, 36>(
    // Front face
    vec3<f32>(-0.5, -0.5,  0.5), vec3<f32>( 0.5, -0.5,  0.5), vec3<f32>( 0.5,  0.5,  0.5),
    vec3<f32>(-0.5, -0.5,  0.5), vec3<f32>( 0.5,  0.5,  0.5), vec3<f32>(-0.5,  0.5,  0.5),
    // Back face
    vec3<f32>( 0.5, -0.5, -0.5), vec3<f32>(-0.5, -0.5, -0.5), vec3<f32>(-0.5,  0.5, -0.5),
    vec3<f32>( 0.5, -0.5, -0.5), vec3<f32>(-0.5,  0.5, -0.5), vec3<f32>( 0.5,  0.5, -0.5),
    // Left face
    vec3<f32>(-0.5, -0.5, -0.5), vec3<f32>(-0.5, -0.5,  0.5), vec3<f32>(-0.5,  0.5,  0.5),
    vec3<f32>(-0.5, -0.5, -0.5), vec3<f32>(-0.5,  0.5,  0.5), vec3<f32>(-0.5,  0.5, -0.5),
    // Right face
    vec3<f32>( 0.5, -0.5,  0.5), vec3<f32>( 0.5, -0.5, -0.5), vec3<f32>( 0.5,  0.5, -0.5),
    vec3<f32>( 0.5, -0.5,  0.5), vec3<f32>( 0.5,  0.5, -0.5), vec3<f32>( 0.5,  0.5,  0.5),
    // Top face
    vec3<f32>(-0.5,  0.5,  0.5), vec3<f32>( 0.5,  0.5,  0.5), vec3<f32>( 0.5,  0.5, -0.5),
    vec3<f32>(-0.5,  0.5,  0.5), vec3<f32>( 0.5,  0.5, -0.5), vec3<f32>(-0.5,  0.5, -0.5),
    // Bottom face
    vec3<f32>(-0.5, -0.5, -0.5), vec3<f32>( 0.5, -0.5, -0.5), vec3<f32>( 0.5, -0.5,  0.5),
    vec3<f32>(-0.5, -0.5, -0.5), vec3<f32>( 0.5, -0.5,  0.5), vec3<f32>(-0.5, -0.5,  0.5),
);

// Face normals for each vertex (matching the vertex order)
const CUBE_NORMALS: array<vec3<f32>, 36> = array<vec3<f32>, 36>(
    // Front face (normal: 0, 0, 1)
    vec3<f32>( 0.0,  0.0,  1.0), vec3<f32>( 0.0,  0.0,  1.0), vec3<f32>( 0.0,  0.0,  1.0),
    vec3<f32>( 0.0,  0.0,  1.0), vec3<f32>( 0.0,  0.0,  1.0), vec3<f32>( 0.0,  0.0,  1.0),
    // Back face (normal: 0, 0, -1)
    vec3<f32>( 0.0,  0.0, -1.0), vec3<f32>( 0.0,  0.0, -1.0), vec3<f32>( 0.0,  0.0, -1.0),
    vec3<f32>( 0.0,  0.0, -1.0), vec3<f32>( 0.0,  0.0, -1.0), vec3<f32>( 0.0,  0.0, -1.0),
    // Left face (normal: -1, 0, 0)
    vec3<f32>(-1.0,  0.0,  0.0), vec3<f32>(-1.0,  0.0,  0.0), vec3<f32>(-1.0,  0.0,  0.0),
    vec3<f32>(-1.0,  0.0,  0.0), vec3<f32>(-1.0,  0.0,  0.0), vec3<f32>(-1.0,  0.0,  0.0),
    // Right face (normal: 1, 0, 0)
    vec3<f32>( 1.0,  0.0,  0.0), vec3<f32>( 1.0,  0.0,  0.0), vec3<f32>( 1.0,  0.0,  0.0),
    vec3<f32>( 1.0,  0.0,  0.0), vec3<f32>( 1.0,  0.0,  0.0), vec3<f32>( 1.0,  0.0,  0.0),
    // Top face (normal: 0, 1, 0)
    vec3<f32>( 0.0,  1.0,  0.0), vec3<f32>( 0.0,  1.0,  0.0), vec3<f32>( 0.0,  1.0,  0.0),
    vec3<f32>( 0.0,  1.0,  0.0), vec3<f32>( 0.0,  1.0,  0.0), vec3<f32>( 0.0,  1.0,  0.0),
    // Bottom face (normal: 0, -1, 0)
    vec3<f32>( 0.0, -1.0,  0.0), vec3<f32>( 0.0, -1.0,  0.0), vec3<f32>( 0.0, -1.0,  0.0),
    vec3<f32>( 0.0, -1.0,  0.0), vec3<f32>( 0.0, -1.0,  0.0), vec3<f32>( 0.0, -1.0,  0.0)
);

struct VoxelPosition {
    x: f32,
    y: f32,
    z: f32,
}

struct VoxelScale {
    x: f32,
    y: f32,
    z: f32,
}

struct VoxelRotation {
    x: f32,
    y: f32,
    z: f32,
    w: f32,
}

@binding(0) @group(0) var<uniform> sceneUniforms: SceneUniforms;
@binding(1) @group(0) var<storage, read> voxelPositions: array<VoxelPosition>;
@binding(2) @group(0) var<storage, read> voxelColors: array<vec4<f32>>;
@binding(3) @group(0) var<storage, read> voxelScales: array<VoxelScale>;
@binding(4) @group(0) var<storage, read> voxelRotations: array<VoxelRotation>;

struct VertexOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) color: vec4<f32>,
    @location(1) worldPosition: vec3<f32>,
    @location(2) normal: vec3<f32>,
}

// Rotate a vector by a quaternion
// q is quaternion (x, y, z, w), v is the vector to rotate
fn rotateByQuaternion(v: vec3<f32>, q: vec4<f32>) -> vec3<f32> {
    let qxyz = vec3<f32>(q.x, q.y, q.z);
    let t = 2.0 * cross(qxyz, v);
    return v + q.w * t + cross(qxyz, t);
}

@vertex
fn vertexMain(@builtin(vertex_index) vertexIndex: u32, @builtin(instance_index) instanceIndex: u32) -> VertexOutput {
    let voxelPosition = voxelPositions[instanceIndex];
    let voxelColor = voxelColors[instanceIndex];
    let voxelScale = voxelScales[instanceIndex];
    let voxelRotation = voxelRotations[instanceIndex];
    
    // Apply scale first
    let scaledVertex = CUBE_VERTICES[vertexIndex] * vec3(voxelScale.x, voxelScale.y, voxelScale.z);
    
    // Then apply rotation
    let quaternion = vec4<f32>(voxelRotation.x, voxelRotation.y, voxelRotation.z, voxelRotation.w);
    let rotatedVertex = rotateByQuaternion(scaledVertex, quaternion);
    
    // Finally add position
    let worldPosition = vec3<f32>(voxelPosition.x, voxelPosition.y, voxelPosition.z) + rotatedVertex;
    let clipPosition = sceneUniforms.viewProjectionMatrix * vec4<f32>(worldPosition, 1.0);
    
    // Rotate the normal as well
    let rotatedNormal = rotateByQuaternion(CUBE_NORMALS[vertexIndex], quaternion);
    
    return VertexOutput(
        clipPosition,
        vec4<f32>(voxelColor.r, voxelColor.g, voxelColor.b, voxelColor.a),
        worldPosition,
        rotatedNormal
    );
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
    let L = normalize(-sceneUniforms.lightDirection); // Light direction (toward light)
    
    // Ambient lighting
    let ambient = sceneUniforms.ambientStrength;
    
    // Diffuse lighting (Lambert)
    let diffuse = max(dot(N, L), 0.0);
    
    // Combine lighting
    let lighting = ambient + diffuse;
    
    // Apply lighting to color (preserve alpha)
    let litRGB = input.color.rgb * lighting;
    let finalColor = vec4<f32>(litRGB, input.color.a);
    
    return FragmentOutput(finalColor);
}
`;

