import { expect, test, describe } from "vitest";
import { Vec3 } from "@adobe/data/math";
import { createTypedBuffer } from "@adobe/data/typed-buffer";
import { MaterialId } from "../../types/material/material-id.js";
import { Volume } from "../../types/volume/volume.js";
import { materialVolumeToVertexData } from "../../plugins/volume-model-rendering/material-volume-to-vertex-data.js";
import { createTestVolume2x2x2 } from "./create-test-volume.js";
import { extractBottomFaceVertices, countBottomFaces, verifyBottomFaceGeometry } from "./verify-bottom-faces.js";

describe("verify-bottom-faces", () => {
    test("extractBottomFaceVertices should extract all vertices with normal [0, -1, 0]", () => {
        const volume = createTestVolume2x2x2();
        const vertexData = materialVolumeToVertexData(volume);
        
        const bottomVertices = extractBottomFaceVertices(vertexData);
        
        // Should have bottom faces for all 4 voxels in bottom layer (z=0)
        // Plus bottom faces for all 4 voxels in top layer (z=2) since middle is empty
        // Each face has 6 vertices (2 triangles * 3 vertices)
        // So should have 8 * 6 = 48 vertices (4 bottom + 4 top)
        expect(bottomVertices.length).toBe(48);
        
        // Bottom layer vertices should have y=0, top layer vertices should have y=2
        // Note: In model space, bottom layer voxels are at y=0-1, so faces are at y=0
        // Top layer voxels are at y=2-3, so their bottom faces are at y=2
        const bottomLayerVertices = bottomVertices.slice(0, 24); // First 24 vertices (4 faces * 6)
        const topLayerVertices = bottomVertices.slice(24, 48); // Next 24 vertices (4 faces * 6)
        
        for (const vertex of bottomLayerVertices) {
            expect(vertex[1]).toBe(0); // Y should be 0 for bottom layer faces
        }
        for (const vertex of topLayerVertices) {
            expect(vertex[1]).toBe(2); // Y should be 2 for top layer bottom faces
        }
    });

    test("countBottomFaces should return the number of bottom faces", () => {
        const volume = createTestVolume2x2x2();
        const vertexData = materialVolumeToVertexData(volume);
        
        const faceCount = countBottomFaces(vertexData);
        
        // Should have 8 bottom faces:
        // - 4 for bottom layer (z=0)
        // - 4 for top layer (z=2) since middle layer is empty
        expect(faceCount).toBe(8);
    });

    test("verifyBottomFaceGeometry should verify bottom faces have correct geometry and winding", () => {
        const volume = createTestVolume2x2x2();
        const vertexData = materialVolumeToVertexData(volume);
        
        const bottomVertices = extractBottomFaceVertices(vertexData);
        // Now we have 8 bottom faces: 4 from bottom layer (z=0) and 4 from top layer (z=2)
        const isValid = verifyBottomFaceGeometry(bottomVertices, [
            [0, 0, 0], // Bottom layer voxel positions
            [1, 0, 0],
            [0, 1, 0],
            [1, 1, 0],
            [0, 0, 2], // Top layer voxel positions (bottom faces visible since middle is empty)
            [1, 0, 2],
            [0, 1, 2],
            [1, 1, 2],
        ]);
        
        expect(isValid).toBe(true);
    });

    test("countBottomFaces should return 0 for empty volume", () => {
        // Create an empty volume (all air)
        const size: Vec3 = [2, 2, 2];
        const capacity = size[0] * size[1] * size[2];
        const emptyVolume: Volume<MaterialId> = {
            size,
            data: createTypedBuffer(MaterialId.schema, capacity),
        };
        
        // Fill with air (0)
        for (let i = 0; i < capacity; i++) {
            emptyVolume.data.set(i, 0);
        }
        
        const vertexData = materialVolumeToVertexData(emptyVolume);
        const faceCount = countBottomFaces(vertexData);
        
        expect(faceCount).toBe(0);
    });
});

