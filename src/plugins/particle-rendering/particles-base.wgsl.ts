// Particle rendering shader with PBR materials - Base variant (no scale/rotation)
import { commonStructs, cubeGeometry, fragmentShader } from './shader-common.js';

export default `${commonStructs}
${cubeGeometry}

@binding(0) @group(0) var<uniform> sceneUniforms: SceneUniforms;
@binding(1) @group(0) var<storage, read> materials: array<Material>;
@binding(2) @group(0) var<storage, read> particlePositions: array<ParticlePosition>;
@binding(3) @group(0) var<storage, read> particleMaterials: array<u32>;

@vertex
fn vertexMain(@builtin(vertex_index) vertexIndex: u32, @builtin(instance_index) instanceIndex: u32) -> VertexOutput {
    let particlePosition = particlePositions[instanceIndex];
    let materialIndex = particleMaterials[instanceIndex];
    let material = materials[materialIndex];
    
    // Unit cube vertex (no scale/rotation)
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

${fragmentShader}
`;
