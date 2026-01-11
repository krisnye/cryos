// Particle rendering shader with PBR materials - Scale only variant
import { commonStructs, cubeGeometry, fragmentShader } from './shader-common.js';

export default `${commonStructs}
${cubeGeometry}

@binding(0) @group(0) var<uniform> sceneUniforms: SceneUniforms;
@binding(1) @group(0) var<storage, read> materials: array<Material>;
@binding(2) @group(0) var<storage, read> particlePositions: array<ParticlePosition>;
@binding(3) @group(0) var<storage, read> particleMaterials: array<u32>;
@binding(4) @group(0) var<storage, read> particleScales: array<ParticleScale>;

@vertex
fn vertexMain(@builtin(vertex_index) vertexIndex: u32, @builtin(instance_index) instanceIndex: u32) -> VertexOutput {
    let particlePosition = particlePositions[instanceIndex];
    let materialIndex = particleMaterials[instanceIndex];
    let material = materials[materialIndex];
    let particleScale = particleScales[instanceIndex];
    
    // Apply scale to vertex
    let vertex = CUBE_VERTICES[vertexIndex];
    let scaledVertex = vertex * vec3<f32>(particleScale.x, particleScale.y, particleScale.z);
    let normal = CUBE_NORMALS[vertexIndex]; // Normals don't need scaling, only rotation
    
    // Add position
    let worldPosition = vec3<f32>(particlePosition.x, particlePosition.y, particlePosition.z) + scaledVertex;
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
