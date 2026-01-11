// Particle rendering shader with PBR materials
// Uses materials buffer with metallic/roughness workflow

export default `
struct SceneUniforms {
    viewProjectionMatrix: mat4x4<f32>,
    lightDirection: vec3<f32>,
    ambientStrength: f32,
    lightColor: vec3<f32>,
}

// Material struct matching Material.schema (std140 layout)
struct Material {
    baseColor: vec4<f32>,
    metallic: f32,
    roughness: f32,
    irReflectance: f32,
    irEmission: f32,
    emissionRgb: vec3<f32>,
    emissionMode: f32,
    density: f32,
    viscosity: f32,
    specificHeatCapacity: f32,
    thermalConductivity: f32,
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

struct ParticlePosition {
    x: f32,
    y: f32,
    z: f32,
}

@binding(0) @group(0) var<uniform> sceneUniforms: SceneUniforms;
@binding(1) @group(0) var<storage, read> materials: array<Material>;
@binding(2) @group(0) var<storage, read> particlePositions: array<ParticlePosition>;
@binding(3) @group(0) var<storage, read> particleMaterials: array<u32>;

struct VertexOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) baseColor: vec4<f32>,
    @location(1) worldPosition: vec3<f32>,
    @location(2) normal: vec3<f32>,
    @location(3) metallic: f32,
    @location(4) roughness: f32,
}

@vertex
fn vertexMain(@builtin(vertex_index) vertexIndex: u32, @builtin(instance_index) instanceIndex: u32) -> VertexOutput {
    let particlePosition = particlePositions[instanceIndex];
    let materialIndex = particleMaterials[instanceIndex];
    let material = materials[materialIndex];
    
    // Unit cube vertex (no scale/rotation for now)
    let vertex = CUBE_VERTICES[vertexIndex];
    let normal = CUBE_NORMALS[vertexIndex];
    
    // Add position
    let worldPosition = vec3<f32>(particlePosition.x, particlePosition.y, particlePosition.z) + vertex;
    let clipPosition = sceneUniforms.viewProjectionMatrix * vec4<f32>(worldPosition, 1.0);
    
    return VertexOutput(
        clipPosition,
        material.baseColor,
        worldPosition,
        normal,
        material.metallic,
        material.roughness
    );
}

struct FragmentOutput {
    @location(0) color: vec4<f32>,
}

// Simplified PBR using metallic/roughness workflow
@fragment
fn fragmentMain(input: VertexOutput) -> FragmentOutput {
    // Discard fully transparent fragments
    if (input.baseColor.a <= 0.0) {
        discard;
    }
    
    // Normalize vectors
    let N = normalize(input.normal);
    let L = normalize(-sceneUniforms.lightDirection); // Light direction (toward light)
    let V = normalize(-input.worldPosition); // View direction (approximate, could use camera position)
    
    // Material properties
    let metallic = input.metallic;
    let roughness = input.roughness;
    let baseColor = input.baseColor.rgb;
    
    // Mix dielectric and conductor based on metallic value
    // For simplicity, we'll use a simplified PBR approach
    let F0 = mix(vec3<f32>(0.04), baseColor, metallic);
    
    // Diffuse term (Lambert)
    let NdotL = max(dot(N, L), 0.0);
    let diffuse = baseColor * (1.0 - metallic) * NdotL;
    
    // Specular term (simplified Blinn-Phong for now)
    let H = normalize(L + V);
    let NdotH = max(dot(N, H), 0.0);
    let specularPower = (1.0 - roughness) * 128.0;
    let specular = F0 * pow(NdotH, specularPower) * metallic;
    
    // Ambient term
    let ambient = baseColor * sceneUniforms.ambientStrength * (1.0 - metallic * 0.5);
    
    // Combine lighting
    let litRGB = ambient + diffuse + specular;
    
    return FragmentOutput(vec4<f32>(litRGB, input.baseColor.a));
}
`;

