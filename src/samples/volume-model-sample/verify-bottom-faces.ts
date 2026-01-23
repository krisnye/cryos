import { Vec3 } from "@adobe/data/math";
import { TypedBuffer } from "@adobe/data/typed-buffer";
import { PositionNormalMaterialVertex } from "../../types/vertices/position-normal-material/index.js";

/**
 * Extract all vertices with normal [0, -1, 0] (bottom faces)
 */
export function extractBottomFaceVertices(vertexData: TypedBuffer<PositionNormalMaterialVertex>): Vec3[] {
    const vertices: Vec3[] = [];
    
    for (let i = 0; i < vertexData.capacity; i++) {
        const vertex = vertexData.get(i);
        // Check if this is a bottom face vertex (normal pointing down: [0, -1, 0])
        if (vertex.normal[0] === 0 && vertex.normal[1] === -1 && vertex.normal[2] === 0) {
            vertices.push([...vertex.position] as Vec3);
        }
    }
    
    return vertices;
}

/**
 * Count the number of bottom faces (groups of 6 vertices with normal [0, -1, 0])
 * Each face consists of 2 triangles = 6 vertices
 */
export function countBottomFaces(vertexData: TypedBuffer<PositionNormalMaterialVertex>): number {
    let bottomVertexCount = 0;
    
    for (let i = 0; i < vertexData.capacity; i++) {
        const vertex = vertexData.get(i);
        if (vertex.normal[0] === 0 && vertex.normal[1] === -1 && vertex.normal[2] === 0) {
            bottomVertexCount++;
        }
    }
    
    // Each face has 6 vertices (2 triangles * 3 vertices)
    return bottomVertexCount / 6;
}

/**
 * Verify that bottom face vertices match expected voxel positions.
 * Checks that vertices are at the correct y positions (bottom of their voxels) and form expected quads.
 * Also verifies winding order (counter-clockwise when viewed from -Y).
 */
export function verifyBottomFaceGeometry(
    bottomVertices: Vec3[],
    expectedVoxelPositions: Vec3[]
): boolean {
    // Verify vertices are at valid y positions (bottom of their respective voxels)
    // Each voxel at [x, y, z] has its bottom face at y (the bottom y coordinate of the voxel)
    // Collect all expected y positions from voxel positions
    const expectedYPositions = new Set<number>();
    for (const voxelPos of expectedVoxelPositions) {
        expectedYPositions.add(voxelPos[1]); // y coordinate of voxel = y position of its bottom face
    }
    
    // Verify all vertices are at one of the expected y positions
    for (const vertex of bottomVertices) {
        let found = false;
        for (const expectedY of expectedYPositions) {
            if (Math.abs(vertex[1] - expectedY) < 0.001) { // Allow small floating point error
                found = true;
                break;
            }
        }
        if (!found) {
            return false;
        }
    }
    
    // Verify we have the expected number of vertices
    // Each voxel should have 1 bottom face = 6 vertices
    const expectedVertexCount = expectedVoxelPositions.length * 6;
    if (bottomVertices.length !== expectedVertexCount) {
        return false;
    }
    
    // Verify winding order for each face (counter-clockwise when viewed from -Y)
    // Each face has 6 vertices (2 triangles * 3 vertices)
    for (let faceIndex = 0; faceIndex < expectedVoxelPositions.length; faceIndex++) {
        const tri1 = [
            bottomVertices[faceIndex * 6 + 0],
            bottomVertices[faceIndex * 6 + 1],
            bottomVertices[faceIndex * 6 + 2],
        ];
        const tri2 = [
            bottomVertices[faceIndex * 6 + 3],
            bottomVertices[faceIndex * 6 + 4],
            bottomVertices[faceIndex * 6 + 5],
        ];
        
        // Compute signed area in XZ plane (when viewed from -Y)
        // For counter-clockwise winding when viewed from -Y, the signed area should be positive
        function computeSignedAreaXZ(v0: Vec3, v1: Vec3, v2: Vec3): number {
            const v0XZ = [v0[0], v0[2]] as [number, number];
            const v1XZ = [v1[0], v1[2]] as [number, number];
            const v2XZ = [v2[0], v2[2]] as [number, number];
            
            // Compute signed area using cross product (determinant)
            const dx1 = v1XZ[0] - v0XZ[0];
            const dz1 = v1XZ[1] - v0XZ[1];
            const dx2 = v2XZ[0] - v0XZ[0];
            const dz2 = v2XZ[1] - v0XZ[1];
            
            return dx1 * dz2 - dz1 * dx2;
        }
        
        const area1 = computeSignedAreaXZ(tri1[0], tri1[1], tri1[2]);
        const area2 = computeSignedAreaXZ(tri2[0], tri2[1], tri2[2]);
        
        // Both triangles should have positive signed area (counter-clockwise when viewed from -Y)
        if (area1 <= 0 || area2 <= 0) {
            return false;
        }
    }
    
    // Verify vertex positions are in the expected XZ plane
    // For a 2x2x3 volume:
    // - Bottom layer (z=0) voxels span [0,0,0] to [1,1,1], faces at y=0 with x,z in [0,2] x [0,1]
    // - Top layer (z=2) voxels span [0,0,2] to [1,1,3], faces at y=0 with x,z in [0,2] x [2,3]
    // Since we're in model space with center at [0,0,0], bottom faces should be at y=0
    
    // Extract unique XZ positions from vertices
    const xzPositions = new Set<string>();
    for (const vertex of bottomVertices) {
        const xzKey = `${vertex[0]},${vertex[2]}`;
        xzPositions.add(xzKey);
    }
    
    // Should have vertices forming quads at expected positions
    // For a 2x2x3 volume with 8 bottom faces (4 bottom + 4 top), we expect more distinct XZ positions
    // This is a basic check - more detailed verification could check exact positions
    return xzPositions.size >= expectedVoxelPositions.length; // At least as many distinct XZ positions as voxels
}

