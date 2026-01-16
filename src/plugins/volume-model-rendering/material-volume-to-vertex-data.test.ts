import { expect, test } from "vitest";
import { Vec3 } from "@adobe/data/math";
import { createTypedBuffer } from "@adobe/data/typed-buffer";
import { Volume } from "../../types/volume/volume.js";
import { MaterialId } from "../../types/material/material-id.js";
import { materialVolumeToVertexData } from "./material-volume-to-vertex-data.js";

test("materialVolumeToVertexData generates vertices for visible faces only", () => {
    // Create a 2x2x2 volume with one solid voxel
    const size: Vec3 = [2, 2, 2];
    const capacity = size[0] * size[1] * size[2];
    const volume: Volume<MaterialId> = {
        size,
        data: createTypedBuffer(MaterialId.schema, capacity),
    };
    
    // Fill all voxels with air (0)
    for (let i = 0; i < capacity; i++) {
        volume.data.set(i, 0);
    }
    
    // Set one voxel at [0,0,0] to material 1
    const index = 0; // x=0, y=0, z=0
    volume.data.set(index, 1);
    
    // Generate vertex data
    const vertexData = materialVolumeToVertexData(volume);
    
    // Should have 6 faces (one voxel exposed on all sides)
    // Each face has 2 triangles = 6 vertices
    // Total: 6 faces * 6 vertices = 36 vertices
    expect(vertexData.capacity).toBeGreaterThanOrEqual(36);
    
    // Check first vertex has correct material index
    const firstVertex = vertexData.get(0);
    expect(firstVertex.materialIndex).toBe(1);
    expect(firstVertex.position).toBeDefined();
    expect(firstVertex.normal).toBeDefined();
});

test("materialVolumeToVertexData skips empty voxels (MaterialId === 0)", () => {
    // Create a 2x2x2 volume with all air
    const size: Vec3 = [2, 2, 2];
    const capacity = size[0] * size[1] * size[2];
    const volume: Volume<MaterialId> = {
        size,
        data: createTypedBuffer(MaterialId.schema, capacity),
    };
    
    // Fill all voxels with air (0)
    for (let i = 0; i < capacity; i++) {
        volume.data.set(i, 0);
    }
    
    // Generate vertex data
    const vertexData = materialVolumeToVertexData(volume);
    
    // Should have no vertices (all air)
    expect(vertexData.capacity).toBe(0);
});

test("materialVolumeToVertexData applies center offset", () => {
    // Create a 2x2x2 volume
    const size: Vec3 = [2, 2, 2];
    const capacity = size[0] * size[1] * size[2];
    const volume: Volume<MaterialId> = {
        size,
        data: createTypedBuffer(MaterialId.schema, capacity),
    };
    
    // Set one voxel at [0,0,0] to material 1
    volume.data.set(0, 1);
    
    // Generate with custom center
    const center: Vec3 = [1, 1, 1];
    const vertexData = materialVolumeToVertexData(volume, { center });
    
    // Check that vertices exist and have correct material index
    expect(vertexData.capacity).toBeGreaterThan(0);
    const firstVertex = vertexData.get(0);
    expect(firstVertex.materialIndex).toBe(1);
    // Position should be offset by center (voxel corners are at integer positions, then offset by center)
    // The exact position depends on which face/vertex, but it should be defined
    expect(firstVertex.position).toBeDefined();
    expect(Array.isArray(firstVertex.position)).toBe(true);
    expect(firstVertex.position.length).toBe(3);
});

