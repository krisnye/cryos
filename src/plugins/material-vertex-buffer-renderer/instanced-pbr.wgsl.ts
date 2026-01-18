// Instanced PBR rendering shader for material vertex buffers
// Generic shader that works with PositionNormalMaterialVertex and materials buffer

export default `
struct SceneUniforms {
    viewProjectionMatrix: mat4x4<f32>,
    lightDirection: vec3<f32>,
    ambientStrength: f32,
    lightColor: vec3<f32>,
    cameraPosition: vec3<f32>,
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

@group(0) @binding(0) var<uniform> sceneUniforms: SceneUniforms;
@group(0) @binding(1) var<storage, read> materials: array<Material>;

// Rotate a vector by a quaternion
fn rotateByQuaternion(v: vec3<f32>, q: vec4<f32>) -> vec3<f32> {
    let qxyz = vec3<f32>(q.x, q.y, q.z);
    let t = 2.0 * cross(qxyz, v);
    return v + q.w * t + cross(qxyz, t);
}

struct VertexOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) baseColor: vec4<f32>,
    @location(1) worldPosition: vec3<f32>,
    @location(2) normal: vec3<f32>,
    @location(3) metallic: f32,
    @location(4) roughness: f32,
}

@vertex
fn vertexMain(
    @location(0) vertexPosition: vec3<f32>,
    @location(1) vertexNormal: vec3<f32>,
    @location(2) materialIndex: u32,
    @location(4) instancePosition: vec3<f32>,
    @location(5) instanceScale: vec3<f32>,
    @location(6) instanceRotation: vec4<f32>,
) -> VertexOutput {
    // Apply instance transform: scale -> rotate -> translate
    let scaledVertex = vertexPosition * instanceScale;
    let rotatedVertex = rotateByQuaternion(scaledVertex, instanceRotation);
    let worldPosition = rotatedVertex + instancePosition;
    
    // Transform normal to world space
    let worldNormal = rotateByQuaternion(vertexNormal, instanceRotation);
    
    // Look up material
    let material = materials[materialIndex];
    
    var output: VertexOutput;
    output.position = sceneUniforms.viewProjectionMatrix * vec4<f32>(worldPosition, 1.0);
    output.baseColor = material.baseColor;
    output.worldPosition = worldPosition;
    output.normal = worldNormal;
    output.metallic = material.metallic;
    output.roughness = material.roughness;
    return output;
}

struct FragmentOutput {
    @location(0) color: vec4<f32>,
}

@fragment
fn fragmentMain(input: VertexOutput) -> FragmentOutput {
    // Discard fully transparent fragments to prevent depth buffer writes
    if (input.baseColor.a <= 0.0) {
        discard;
    }
    
    // Normalize vectors
    let N = normalize(input.normal);
    let L = normalize(-sceneUniforms.lightDirection); // Light direction (toward light)
    // View direction: from fragment to camera
    let V = normalize(sceneUniforms.cameraPosition - input.worldPosition);
    
    // Material properties
    let metallic = input.metallic;
    let roughness = input.roughness;
    let baseColor = input.baseColor.rgb;
    
    // Mix dielectric and conductor based on metallic value
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

