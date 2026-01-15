// Transparent particle rendering shader - Base variant (no scale/rotation)
// Uses indirect indexing via sorted index buffer for back-to-front rendering
import { commonStructs, cubeGeometry, fragmentShader } from '../shader-common.js';

export default `${commonStructs}
${cubeGeometry}

@binding(0) @group(0) var<uniform> sceneUniforms: SceneUniforms;
@binding(1) @group(0) var<storage, read> materials: array<Material>;
@binding(2) @group(0) var<storage, read> particlePositions: array<ParticlePosition>;
@binding(3) @group(0) var<storage, read> particleMaterials: array<u32>;
@binding(4) @group(0) var<storage, read> sortedIndices: array<u32>;

@vertex
fn vertexMain(@builtin(vertex_index) vertexIndex: u32, @builtin(instance_index) instanceIndex: u32) -> VertexOutput {
    // Use indirect indexing: sortedIndices maps sorted order to original particle indices
    let originalIndex = sortedIndices[instanceIndex];
    let particlePosition = particlePositions[originalIndex];
    let materialIndex = particleMaterials[originalIndex];
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

