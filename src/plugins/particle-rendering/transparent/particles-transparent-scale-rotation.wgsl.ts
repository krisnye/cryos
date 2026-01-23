// Transparent particle rendering shader - Scale + Rotation variant
// Uses indirect indexing via sorted index buffer for back-to-front rendering
import { commonStructs, cubeGeometry, fragmentShader, quaternionFunctions } from '../shader-common.js';

export default `${commonStructs}
${cubeGeometry}
${quaternionFunctions}

@binding(0) @group(0) var<uniform> sceneUniforms: SceneUniforms;
@binding(1) @group(0) var<storage, read> materials: array<Material>;
@binding(2) @group(0) var<storage, read> particlePositions: array<ParticlePosition>;
@binding(3) @group(0) var<storage, read> particleMaterials: array<u32>;
@binding(4) @group(0) var<storage, read> particleScales: array<ParticleScale>;
@binding(5) @group(0) var<storage, read> particleRotations: array<ParticleRotation>;
@binding(6) @group(0) var<storage, read> sortedIndices: array<u32>;

@vertex
fn vertexMain(@builtin(vertex_index) vertexIndex: u32, @builtin(instance_index) instanceIndex: u32) -> VertexOutput {
    // Use indirect indexing: sortedIndices maps sorted order to original particle indices
    let originalIndex = sortedIndices[instanceIndex];
    let particlePosition = particlePositions[originalIndex];
    let materialIndex = particleMaterials[originalIndex];
    let material = materials[materialIndex];
    let particleScale = particleScales[originalIndex];
    let particleRotation = particleRotations[originalIndex];
    
    // Apply scale first
    let vertex = CUBE_VERTICES[vertexIndex];
    let scaledVertex = vertex * vec3<f32>(particleScale.x, particleScale.y, particleScale.z);
    
    // Then apply rotation
    let quaternion = vec4<f32>(particleRotation.x, particleRotation.y, particleRotation.z, particleRotation.w);
    let rotatedVertex = rotateByQuaternion(scaledVertex, quaternion);
    
    // Rotate the normal as well (no scale on normals)
    let normal = CUBE_NORMALS[vertexIndex];
    let rotatedNormal = rotateByQuaternion(normal, quaternion);
    
    // Finally add position
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

