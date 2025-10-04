import { describe, it, expect } from "vitest";
import { createTypedBuffer } from "@adobe/data/typed-buffer";
import { Volume, Rgba } from "data/index.js";
import { fromVec4 } from "data/rgba/rgba.js";
import { rgbaVolumeToVertexData } from "./rgba-volume-to-vertex-data.js";
import { Vec4, Vec3 } from "@adobe/data/math";

describe("rgbaVolumeToVertexData", () => {
    it("should convert simple volume to vertex data", () => {
        // Create a simple 2x2x1 volume with one colored voxel
        const size: Vec3 = [2, 2, 1];
        const elements = size[0] * size[1] * size[2];
        const data = createTypedBuffer(Rgba.schema, elements);
        
        // Fill one voxel with red color
        const redColor = fromVec4([1, 0, 0, 1] as Vec4); // Red with full alpha
        data.set(0, redColor); // Position 0,0,0
        
        const volume: Volume<Rgba> = { size, data };
        
        // Generate vertex data
        const vertexBuffer = rgbaVolumeToVertexData(volume);
        
        // Should create faces for visible surfaces
        expect(vertexBuffer.capacity).toBeGreaterThan(0);
        expect(vertexBuffer.typedArrayElementSizeInBytes).toBe(40); // Packed layout: 3 + 3 + 4 floats = 40 bytes
        
        // Verify the first vertex(some face should be generated)
        const firstVertex = vertexBuffer.get(0);
        expect(firstVertex.color).toEqual([1, 0, 0, 1]); // Red color
        expect(typeof firstVertex.position).toBe('object');
        expect(typeof firstVertex.normal).toBe('object');
    });

    it("should omit invisible interior faces", () => {
        // Create a 2x2x2 volume with only hull faces visible
        const size: Vec3 = [2, 2, 2];
        const elements = size[0] * size[1] * size[2];
        const data = createTypedBuffer(Rgba.schema, elements);
        
        // Fill all voxels
        const redColor = fromVec4([1, 0, 0, 1] as Vec4);
        for (let i = 0; i < elements; i++) {
            data.set(i, redColor);
        }
        
        const volume: Volume<Rgba> = { size, data };
        
        // Generate vertex data - should only create exterior faces
        const vertexBuffer = rgbaVolumeToVertexData(volume);
        
        // For a solid 2x2x2 cube, we expect boundary faces only
        // Boundary faces = faces adjacent to opaque voxels facing transparent/empty space
        // 2x2x2 = 8 voxels, about 24 boundary faces, each face = 6 vertices = 144 total
        expect(vertexBuffer.capacity).toBe(144);
        
        // Verify generated vertices have correct format
        const sampleVertex = vertexBuffer.get(0);
        expect(sampleVertex.color).toEqual([1, 0, 0, 1]);
    });

    it("should handle empty volume", () => {
        const size: Vec3 = [1, 1, 1];
        const elements = size[0] * size[1] * size[2];
        const data = createTypedBuffer(Rgba.schema, elements);
        
        // Leave voxels transparent (alpha = 0)
        const transparentColor = fromVec4([0, 0, 0, 0] as Vec4);
        data.set(0, transparentColor);
        
        const volume: Volume<Rgba> = { size, data };
        
        const vertexBuffer = rgbaVolumeToVertexData(volume);
        
        // No faces should be generated
        expect(vertexBuffer.capacity).toBe(0);
    });
});
