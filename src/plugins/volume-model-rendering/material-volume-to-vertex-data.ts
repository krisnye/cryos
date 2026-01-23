import { TypedBuffer, createStructBuffer } from "@adobe/data/typed-buffer";
import { Mutable } from "@adobe/data";
import { Vec3 } from "@adobe/data/math";
import { PositionNormalMaterialVertex } from "../../types/vertices/position-normal-material/index.js";
import { DenseVolume } from "../../types/dense-volume/dense-volume.js";
import * as DenseVolumeNamespace from "../../types/dense-volume/namespace.js";
import { MaterialId } from "../../types/material/material-id.js";
import { Material } from "../../types/index.js";

// Pre-computed direction vectors for performance
const DIRECTIONS: readonly Vec3[] = [
    [1, 0, 0], [-1, 0, 0],  // +X, -X
    [0, 1, 0], [0, -1, 0],  // +Y, -Y
    [0, 0, 1], [0, 0, -1]   // +Z, -Z
] as const;

// Pre-computed quad indices using integer offsets
// Each normal maps directly to its index: [1,0,0]=0, [-1,0,0]=1, [0,1,0]=2, etc.
// Vertices are in counter-clockwise order when viewed from outside the cube
const FACE_QUADS: readonly number[][] = [
    [2, 6, 5, 1],   // +X face (right) - counter-clockwise when viewed from +X
    [4, 7, 3, 0],   // -X face (left) - counter-clockwise when viewed from -X
    [3, 7, 6, 2],   // +Y face (top) - counter-clockwise when viewed from +Y
    [1, 5, 4, 0],   // -Y face (bottom) - counter-clockwise when viewed from -Y
    [5, 6, 7, 4],   // +Z face (front) - counter-clockwise when viewed from +Z
    [3, 2, 1, 0]    // -Z face (back) - counter-clockwise when viewed from -Z
];

// Convert normal vector to direct array index (no string operations!)
function getNormalIndex(dx: number, dy: number, dz: number): number {
    // Only check the non-zero component since we know exactly 6 valid normals
    if (dx === 1) return 0;   // +X
    if (dx === -1) return 1;   // -X
    if (dy === 1) return 2;    // +Y
    if (dy === -1) return 3;   // -Y
    if (dz === 1) return 4;    // +Z
    if (dz === -1) return 5;  // -Z
    return 0; // fallback to +X
}

// Face data stored as flat array: [x, y, z, dx, dy, dz, materialIndex] per face
// Access pattern: faces[i * 7 + 0] = x, faces[i * 7 + 1] = y, etc.
const FACE_DATA_SIZE = 7;

/**
 * Check if a material should be treated as "solid" for face visibility.
 * For opaque rendering: only opaque materials are solid (transparent treated as empty)
 * For transparent rendering: only transparent materials are solid (opaque treated as empty)
 */
function isSolid(materialId: MaterialId, opaque: boolean): boolean {
    if (materialId === 0) return false; // Air is never solid
    
    // Check if material exists
    if (materialId >= Material.materials.length) return false; // Invalid material ID
    
    const material = Material.materials[materialId];
    if (!material) return false; // Unknown material
    
    const isTransparent = material.baseColor[3] < 1.0;
    
    if (opaque) {
        // For opaque rendering: only opaque materials are solid
        return !isTransparent;
    } else {
        // For transparent rendering: only transparent materials are solid
        return isTransparent;
    }
}

export function materialVolumeToVertexData(
    volume: DenseVolume<MaterialId>, 
    options: { center?: Vec3; opaque: boolean }
): TypedBuffer<PositionNormalMaterialVertex> {
    const { center = [0, 0, 0], opaque } = options;
    const [width, height, depth] = volume.size;
    
    // First pass: collect visible faces
    // Pre-allocate faces array as flat number array: [x, y, z, dx, dy, dz, materialIndex] per face
    const estimatedCapacity = width * height * depth * 3; // conservative estimate
    const faces = new Array<number>(estimatedCapacity * FACE_DATA_SIZE);
    let faceCount = 0;

    // Helper function to mutate reusable vertex position array (zero allocations!)
    function setVertexPosition(position: Mutable<Vec3>, x: number, y: number, z: number, vertexIndex: number, x1: number, y1: number, z1: number): Vec3 {
        switch (vertexIndex) {
            case 0: position[0] = x; position[1] = y; position[2] = z; break;      // 0: min corner
            case 1: position[0] = x1; position[1] = y; position[2] = z; break;    // 1: maxX minY minZ
            case 2: position[0] = x1; position[1] = y1; position[2] = z; break;   // 2: maxX maxY minZ
            case 3: position[0] = x; position[1] = y1; position[2] = z; break;   // 3: minX maxY minZ
            case 4: position[0] = x; position[1] = y; position[2] = z1; break;    // 4: minX minY maxZ
            case 5: position[0] = x1; position[1] = y; position[2] = z1; break;   // 5: maxX minY maxZ
            case 6: position[0] = x1; position[1] = y1; position[2] = z1; break;  // 6: maxX maxY maxZ
            case 7: position[0] = x; position[1] = y1; position[2] = z1; break;   // 7: minX maxY maxZ
            default: position[0] = x; position[1] = y; position[2] = z; break;   // fallback
        }
        position[0] -= center[0];
        position[1] -= center[1];
        position[2] -= center[2];
        return position; // Return as Vec3 type
    }
    
    // Check all voxels in the volume
    for (let z = 0; z < depth; z++) {
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const voxelIndex = DenseVolumeNamespace.index(volume, x, y, z);
                const materialId = volume.data.get(voxelIndex);
                
                // Skip if voxel is not solid for this rendering mode
                if (!isSolid(materialId, opaque)) continue;
                
                // Check all 6 directions for adjacent non-solid voxels
                for (const [dx, dy, dz] of DIRECTIONS) {
                    const nx = x + dx;
                    const ny = y + dy;
                    const nz = z + dz;
                    
                    // Check if adjacent voxel is out of bounds
                    const isBoundary = nx < 0 || nx >= width ||
                                       ny < 0 || ny >= height ||
                                       nz < 0 || nz >= depth;
                    
                    // Check if adjacent voxel is not solid (empty or opposite type)
                    const adjacentMaterialId = !isBoundary ? volume.data.get(DenseVolumeNamespace.index(volume, nx, ny, nz)) : 0;
                    const isAdjacentSolid = isSolid(adjacentMaterialId, opaque);
                    
                    // Generate face if adjacent is boundary or not solid
                    // Store face data in flat array: [x, y, z, dx, dy, dz, materialIndex]
                    if (isBoundary || !isAdjacentSolid) {
                        const faceOffset = faceCount * FACE_DATA_SIZE;
                        faces[faceOffset + 0] = x;
                        faces[faceOffset + 1] = y;
                        faces[faceOffset + 2] = z;
                        faces[faceOffset + 3] = dx;
                        faces[faceOffset + 4] = dy;
                        faces[faceOffset + 5] = dz;
                        faces[faceOffset + 6] = materialId;
                        faceCount++;
                    }
                }
            }
        }
    }

    // Create vertex buffer with precise capacity (6 vertices per face)
    const vertexCount = faceCount * 6; // 2 triangles per face, 3 vertices per triangle
    const vertexBuffer = createStructBuffer(PositionNormalMaterialVertex.schema, vertexCount);
    
    // Second pass: generate vertices
    let vertexIndex = 0;
    
    // Reusable arrays and vertex object to avoid ALL allocations
    const position: Mutable<Vec3> = [0, 0, 0];
    const normal: Mutable<Vec3> = [0, 0, 0];
    const vertex: Mutable<PositionNormalMaterialVertex> = {
        position: position,
        normal: normal,
        materialIndex: 0
    };
    
    // Only iterate over initialized faces
    for (let i = 0; i < faceCount; i++) {
        // Access face data from flat array: [x, y, z, dx, dy, dz, materialIndex]
        const faceOffset = i * FACE_DATA_SIZE;
        const x = faces[faceOffset + 0];
        const y = faces[faceOffset + 1];
        const z = faces[faceOffset + 2];
        const dx = faces[faceOffset + 3];
        const dy = faces[faceOffset + 4];
        const dz = faces[faceOffset + 5];
        const materialId = faces[faceOffset + 6];
        
        // Set normal once per face (reuse array)
        normal[0] = dx; normal[1] = dy; normal[2] = dz;
        vertex.materialIndex = materialId; // Set material index once per face

        // Use pre-computed quad indices based on face direction
        // Direct integer index - no string operations!
        const normalIndex = getNormalIndex(dx, dy, dz);
        const quadIndices = FACE_QUADS[normalIndex];

        // Generate vertices on-demand to minimize allocations
        const v0I = quadIndices[0], v1I = quadIndices[1], v2I = quadIndices[2], v3I = quadIndices[3];
        
        // Pre-calculate the offset values for efficiency
        const x1 = x + 1, y1 = y + 1, z1 = z + 1;
        
        // Triangle 1: v0, v1, v2 (zero object allocations!)
        setVertexPosition(position, x, y, z, v0I, x1, y1, z1);
        vertexBuffer.set(vertexIndex++, vertex);
        
        setVertexPosition(position, x, y, z, v1I, x1, y1, z1);
        vertexBuffer.set(vertexIndex++, vertex);
        
        setVertexPosition(position, x, y, z, v2I, x1, y1, z1);
        vertexBuffer.set(vertexIndex++, vertex);
        
        // Triangle 2: v0, v2, v3 (zero object allocations!)
        setVertexPosition(position, x, y, z, v0I, x1, y1, z1);
        vertexBuffer.set(vertexIndex++, vertex);
        
        setVertexPosition(position, x, y, z, v2I, x1, y1, z1);
        vertexBuffer.set(vertexIndex++, vertex);
        
        setVertexPosition(position, x, y, z, v3I, x1, y1, z1);
        vertexBuffer.set(vertexIndex++, vertex);
    }
    
    return vertexBuffer;
}

