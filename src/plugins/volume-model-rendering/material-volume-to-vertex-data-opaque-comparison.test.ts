import { expect, test, describe } from "vitest";
import { createTestVolume2x2x2 } from "../../samples/volume-model-sample/create-test-volume.js";
import { materialVolumeToVertexData } from "./material-volume-to-vertex-data.js";

describe("materialVolumeToVertexData opaque rendering comparison", () => {
    test("given a 2x2x3 volume with air in middle layer, and the same volume with glass in middle layer, opaque render vertices should be identical", () => {
        const volumeWithAir = createTestVolume2x2x2({ middleLayer: "air" });
        const volumeWithGlass = createTestVolume2x2x2({ middleLayer: "glass" });

        const vertexDataWithAir = materialVolumeToVertexData(volumeWithAir, { opaque: true });
        const vertexDataWithGlass = materialVolumeToVertexData(volumeWithGlass, { opaque: true });

        expect(vertexDataWithGlass.capacity).toBe(vertexDataWithAir.capacity);

        for (let i = 0; i < vertexDataWithAir.capacity; i++) {
            const vAir = vertexDataWithAir.get(i);
            const vGlass = vertexDataWithGlass.get(i);
            expect(vGlass.position[0]).toBeCloseTo(vAir.position[0], 5);
            expect(vGlass.position[1]).toBeCloseTo(vAir.position[1], 5);
            expect(vGlass.position[2]).toBeCloseTo(vAir.position[2], 5);
            expect(vGlass.normal[0]).toBeCloseTo(vAir.normal[0], 5);
            expect(vGlass.normal[1]).toBeCloseTo(vAir.normal[1], 5);
            expect(vGlass.normal[2]).toBeCloseTo(vAir.normal[2], 5);
            expect(vGlass.materialIndex).toBe(vAir.materialIndex);
        }
    });
});

