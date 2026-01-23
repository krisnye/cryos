import { expect, test } from "vitest";
import { Vec3 } from "@adobe/data/math";
import { createTypedBuffer } from "@adobe/data/typed-buffer";
import { DenseVolume } from "../../types/dense-volume/dense-volume.js";
import { MaterialId } from "../../types/material/material-id.js";
import { Material } from "../../types/index.js";
import { materialVolumeToVertexData } from "./material-volume-to-vertex-data.js";

test("materialVolumeToVertexData generates vertices for visible faces only", () => {
    // Create a 2x2x2 volume with one solid voxel
    const size: Vec3 = [2, 2, 2];
    const capacity = size[0] * size[1] * size[2];
    const volume: DenseVolume<MaterialId> = {
        type: "dense",
        size,
        data: createTypedBuffer(MaterialId.schema, capacity),
    };
    
    // Fill all voxels with air (0)
    for (let i = 0; i < capacity; i++) {
        volume.data.set(i, 0);
    }
    
    // Set one voxel at [0,0,0] to an opaque material (use first available opaque material)
    // Find first opaque material (alpha === 1.0)
    let opaqueMaterialId: MaterialId = 1; // Default fallback
    for (let i = 1; i < Material.materials.length; i++) {
        if (Material.materials[i].baseColor[3] >= 1.0) {
            opaqueMaterialId = i;
            break;
        }
    }
    const index = 0; // x=0, y=0, z=0
    volume.data.set(index, opaqueMaterialId);
    
    // Generate vertex data (opaque rendering)
    const vertexData = materialVolumeToVertexData(volume, { opaque: true });
    
    // Should have 6 faces (one voxel exposed on all sides)
    // Each face has 2 triangles = 6 vertices
    // Total: 6 faces * 6 vertices = 36 vertices
    expect(vertexData.capacity).toBeGreaterThanOrEqual(36);
    
    // Check first vertex has correct material index
    const firstVertex = vertexData.get(0);
    expect(firstVertex.materialIndex).toBe(opaqueMaterialId);
    expect(firstVertex.position).toBeDefined();
    expect(firstVertex.normal).toBeDefined();
});

test("materialVolumeToVertexData skips empty voxels (MaterialId === 0)", () => {
    // Create a 2x2x2 volume with all air
    const size: Vec3 = [2, 2, 2];
    const capacity = size[0] * size[1] * size[2];
    const volume: DenseVolume<MaterialId> = {
        type: "dense",
        size,
        data: createTypedBuffer(MaterialId.schema, capacity),
    };
    
    // Fill all voxels with air (0)
    for (let i = 0; i < capacity; i++) {
        volume.data.set(i, 0);
    }
    
    // Generate vertex data (opaque rendering)
    const vertexData = materialVolumeToVertexData(volume, { opaque: true });
    
    // Should have no vertices (all air)
    expect(vertexData.capacity).toBe(0);
});

test("materialVolumeToVertexData renders in model space (0,0,0 at corner)", () => {
    // Create a 2x2x2 volume
    const size: Vec3 = [2, 2, 2];
    const capacity = size[0] * size[1] * size[2];
    const volume: DenseVolume<MaterialId> = {
        type: "dense",
        size,
        data: createTypedBuffer(MaterialId.schema, capacity),
    };
    
    // Find first opaque material (alpha === 1.0)
    let opaqueMaterialId: MaterialId = 1; // Default fallback
    for (let i = 1; i < Material.materials.length; i++) {
        if (Material.materials[i].baseColor[3] >= 1.0) {
            opaqueMaterialId = i;
            break;
        }
    }
    volume.data.set(0, opaqueMaterialId);
    
    // Generate vertex data (opaque rendering)
    const vertexData = materialVolumeToVertexData(volume, { opaque: true });
    
    // Check that vertices exist and have correct material index
    expect(vertexData.capacity).toBeGreaterThan(0);
    const firstVertex = vertexData.get(0);
    expect(firstVertex.materialIndex).toBe(opaqueMaterialId);
    // Position should be in model space: 0,0,0 at corner of 0th index
    // Voxel at [0,0,0] should have vertices at [0,0,0] to [1,1,1] range
    expect(firstVertex.position).toBeDefined();
    expect(Array.isArray(firstVertex.position)).toBe(true);
    expect(firstVertex.position.length).toBe(3);
    // First voxel should have positions in [0,1] range (not centered around 0)
    expect(firstVertex.position[0]).toBeGreaterThanOrEqual(0);
    expect(firstVertex.position[0]).toBeLessThanOrEqual(1);
    expect(firstVertex.position[1]).toBeGreaterThanOrEqual(0);
    expect(firstVertex.position[1]).toBeLessThanOrEqual(1);
    expect(firstVertex.position[2]).toBeGreaterThanOrEqual(0);
    expect(firstVertex.position[2]).toBeLessThanOrEqual(1);
});

test("materialVolumeToVertexData generates bottom faces with correct winding (counter-clockwise when viewed from -Y)", () => {
    // Create a 1x1x1 volume with one solid voxel at (0,0,0)
    const size: Vec3 = [1, 1, 1];
    const capacity = size[0] * size[1] * size[2];
    const volume: DenseVolume<MaterialId> = {
        type: "dense",
        size,
        data: createTypedBuffer(MaterialId.schema, capacity),
    };
    
    // Find first opaque material
    let opaqueMaterialId: MaterialId = 1;
    for (let i = 1; i < Material.materials.length; i++) {
        if (Material.materials[i].baseColor[3] >= 1.0) {
            opaqueMaterialId = i;
            break;
        }
    }
    volume.data.set(0, opaqueMaterialId); // Voxel at (0,0,0)
    
    // Generate vertex data (opaque rendering)
    const vertexData = materialVolumeToVertexData(volume, { opaque: true });
    
    // Find bottom face vertices (normal [0, -1, 0])
    const bottomVertices: Vec3[] = [];
    for (let i = 0; i < vertexData.capacity; i++) {
        const vertex = vertexData.get(i);
        // Check if this is a bottom face vertex (normal pointing down: [0, -1, 0])
        if (vertex.normal[0] === 0 && vertex.normal[1] === -1 && vertex.normal[2] === 0) {
            bottomVertices.push([...vertex.position] as Vec3);
        }
    }
    
    // Should have exactly 6 vertices for bottom face (2 triangles * 3 vertices)
    expect(bottomVertices.length).toBe(6);
    
    // Extract triangle 1 (first 3 vertices) and triangle 2 (next 3 vertices)
    const tri1 = [bottomVertices[0], bottomVertices[1], bottomVertices[2]];
    const tri2 = [bottomVertices[3], bottomVertices[4], bottomVertices[5]];
    
    // Function to compute signed area in XZ plane (when viewed from -Y)
    // For counter-clockwise winding when viewed from -Y, the signed area should be positive
    function computeSignedAreaXZ(v0: Vec3, v1: Vec3, v2: Vec3): number {
        // Project to XZ plane (y=0 for bottom face)
        const v0XZ = [v0[0], v0[2]] as [number, number];
        const v1XZ = [v1[0], v1[2]] as [number, number];
        const v2XZ = [v2[0], v2[2]] as [number, number];
        
        // Compute signed area using cross product (determinant)
        // area = (v1.x - v0.x) * (v2.z - v0.z) - (v1.z - v0.z) * (v2.x - v0.x)
        const dx1 = v1XZ[0] - v0XZ[0];
        const dz1 = v1XZ[1] - v0XZ[1];
        const dx2 = v2XZ[0] - v0XZ[0];
        const dz2 = v2XZ[1] - v0XZ[1];
        
        return dx1 * dz2 - dz1 * dx2;
    }
    
    // Both triangles should have positive signed area (counter-clockwise when viewed from -Y)
    const area1 = computeSignedAreaXZ(tri1[0], tri1[1], tri1[2]);
    const area2 = computeSignedAreaXZ(tri2[0], tri2[1], tri2[2]);
    
    expect(area1).toBeGreaterThan(0);
    expect(area2).toBeGreaterThan(0);
    
    // Verify all bottom vertices have y=0 (they're on the bottom face)
    for (const vertex of bottomVertices) {
        expect(vertex[1]).toBe(0); // Y should be 0 for bottom face of voxel at (0,0,0)
    }
});

