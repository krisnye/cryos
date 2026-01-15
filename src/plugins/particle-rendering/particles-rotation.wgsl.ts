// Particle rendering shader with PBR materials - Rotation only variant
import { commonStructs, cubeGeometry, fragmentShader, quaternionFunctions } from './shader-common.js';

export default `${commonStructs}
${cubeGeometry}
${quaternionFunctions}

@binding(0) @group(0) var<uniform> sceneUniforms: SceneUniforms;
@binding(1) @group(0) var<storage, read> materials: array<Material>;
@binding(2) @group(0) var<storage, read> particlePositions: array<ParticlePosition>;
@binding(3) @group(0) var<storage, read> particleMaterials: array<u32>;
@binding(4) @group(0) var<storage, read> particleRotations: array<ParticleRotation>;

@vertex
fn vertexMain(@builtin(vertex_index) vertexIndex: u32, @builtin(instance_index) instanceIndex: u32) -> VertexOutput {
    let particlePosition = particlePositions[instanceIndex];
    let materialIndex = particleMaterials[instanceIndex];
    let material = materials[materialIndex];
    let particleRotation = particleRotations[instanceIndex];
    
    // Apply rotation to vertex
    let vertex = CUBE_VERTICES[vertexIndex];
    let quaternion = vec4<f32>(particleRotation.x, particleRotation.y, particleRotation.z, particleRotation.w);
    let rotatedVertex = rotateByQuaternion(vertex, quaternion);
    
    // Rotate the normal as well
    let normal = CUBE_NORMALS[vertexIndex];
    let rotatedNormal = rotateByQuaternion(normal, quaternion);
    
    // Add position
    let worldPosition = vec3<f32>(particlePosition.x, particlePosition.y, particlePosition.z) + rotatedVertex;
    let clipPosition = sceneUniforms.viewProjectionMatrix * vec4<f32>(worldPosition, 1.0);
    
    return VertexOutput(
        clipPosition,
        material.baseColor,
        worldPosition,
        rotatedNormal,
        material.metallic,
        material.roughness
    );
}

${fragmentShader}
`;
