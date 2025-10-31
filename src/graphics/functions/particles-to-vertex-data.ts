import { TypedBuffer, createStructBuffer } from "@adobe/data/typed-buffer";
import { PositionColorNormalVertex, positionColorNormalVertexSchema } from "graphics/vertices/position-color-normal.js";
import { Mat4x4, Quat, Vec3, Vec4 } from "@adobe/data/math";
import { Mutable } from "@adobe/data";

export interface Particle {
    position: Vec3;
    scale: Vec3;
    rotation: Quat;
    color: Vec4;
}

// Pre-computed direction vectors for cube faces
const FACE_NORMALS: readonly Vec3[] = [
    [1, 0, 0], [-1, 0, 0],  // +X, -X
    [0, 1, 0], [0, -1, 0],  // +Y, -Y
    [0, 0, 1], [0, 0, -1]   // +Z, -Z
] as const;

// Pre-computed quad vertex indices for each face
// Vertices are in counter-clockwise order when viewed from outside the cube
const FACE_QUADS: readonly number[][] = [
    [2, 6, 5, 1],   // +X face (right)
    [4, 7, 3, 0],   // -X face (left)
    [3, 7, 6, 2],   // +Y face (top)
    [1, 5, 4, 0],   // -Y face (bottom)
    [5, 6, 7, 4],   // +Z face (front)
    [3, 2, 1, 0]    // -Z face (back)
];

// 8 corners of a unit cube centered at origin
const CUBE_CORNERS: readonly Vec3[] = [
    [-0.5, -0.5, -0.5], // 0: min corner
    [0.5, -0.5, -0.5],  // 1: maxX minY minZ
    [0.5, 0.5, -0.5],   // 2: maxX maxY minZ
    [-0.5, 0.5, -0.5],  // 3: minX maxY minZ
    [-0.5, -0.5, 0.5],  // 4: minX minY maxZ
    [0.5, -0.5, 0.5],   // 5: maxX minY maxZ
    [0.5, 0.5, 0.5],    // 6: maxX maxY maxZ
    [-0.5, 0.5, 0.5]    // 7: minX maxY maxZ
] as const;

/**
 * Converts an array of particles into vertex data for rendering.
 * Each particle becomes a transformed cube with 6 faces (12 triangles, 36 vertices).
 */
export const particlesToVertexData = (particles: readonly Particle[]): TypedBuffer<PositionColorNormalVertex> => {
    // Each particle has 6 faces, each face has 6 vertices (2 triangles)
    const verticesPerParticle = 6 * 6;
    const vertexCount = particles.length * verticesPerParticle;
    const vertexBuffer = createStructBuffer(positionColorNormalVertexSchema, vertexCount);
    
    // Reusable arrays and vertex object to avoid allocations
    const position: Mutable<Vec3> = [0, 0, 0];
    const normal: Mutable<Vec3> = [0, 0, 0];
    const vertex: Mutable<PositionColorNormalVertex> = {
        position: position,
        normal: normal,
        color: [0, 0, 0, 1]
    };
    
    // Pre-allocate transformation corners array
    const transformedCorners: Mutable<Vec3>[] = Array.from({ length: 8 }, () => [0, 0, 0]);
    
    let vertexIndex = 0;
    
    for (const particle of particles) {
        const { position: particlePos, scale, rotation, color } = particle;
        
        // Create transformation matrix: Scale -> Rotate -> Translate
        const scaleMatrix = Mat4x4.scaling(scale[0], scale[1], scale[2]);
        const rotationMatrix = Quat.toMat4(rotation);
        const transform = Mat4x4.multiply(rotationMatrix, scaleMatrix);
        
        // Transform all 8 corners of the cube
        for (let i = 0; i < 8; i++) {
            const corner = CUBE_CORNERS[i];
            // Apply scale and rotation
            const transformed = Mat4x4.multiplyVec3(transform, corner);
            // Apply translation
            transformedCorners[i][0] = transformed[0] + particlePos[0];
            transformedCorners[i][1] = transformed[1] + particlePos[1];
            transformedCorners[i][2] = transformed[2] + particlePos[2];
        }
        
        // Set color once per particle
        vertex.color = color as [number, number, number, number];
        
        // Generate all 6 faces
        for (let faceIndex = 0; faceIndex < 6; faceIndex++) {
            const faceNormal = FACE_NORMALS[faceIndex];
            const quadIndices = FACE_QUADS[faceIndex];
            
            // Transform the normal by rotation
            const transformedNormal = Mat4x4.multiplyVec3(rotationMatrix, faceNormal);
            normal[0] = transformedNormal[0];
            normal[1] = transformedNormal[1];
            normal[2] = transformedNormal[2];
            
            // Get the 4 corners for this face
            const v0 = transformedCorners[quadIndices[0]];
            const v1 = transformedCorners[quadIndices[1]];
            const v2 = transformedCorners[quadIndices[2]];
            const v3 = transformedCorners[quadIndices[3]];
            
            // Triangle 1: v0, v1, v2
            position[0] = v0[0]; position[1] = v0[1]; position[2] = v0[2];
            vertexBuffer.set(vertexIndex++, vertex);
            
            position[0] = v1[0]; position[1] = v1[1]; position[2] = v1[2];
            vertexBuffer.set(vertexIndex++, vertex);
            
            position[0] = v2[0]; position[1] = v2[1]; position[2] = v2[2];
            vertexBuffer.set(vertexIndex++, vertex);
            
            // Triangle 2: v0, v2, v3
            position[0] = v0[0]; position[1] = v0[1]; position[2] = v0[2];
            vertexBuffer.set(vertexIndex++, vertex);
            
            position[0] = v2[0]; position[1] = v2[1]; position[2] = v2[2];
            vertexBuffer.set(vertexIndex++, vertex);
            
            position[0] = v3[0]; position[1] = v3[1]; position[2] = v3[2];
            vertexBuffer.set(vertexIndex++, vertex);
        }
    }
    
    return vertexBuffer;
};

