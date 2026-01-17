import { expect, test, describe } from "vitest";
import { Vec3 } from "@adobe/data/math";
import { createTypedBuffer } from "@adobe/data/typed-buffer";
import { Volume } from "../../types/volume/volume.js";
import { MaterialId } from "../../types/material/material-id.js";
import { Material } from "../../types/index.js";
import { materialVolumeToVertexData } from "./material-volume-to-vertex-data.js";
import * as VolumeNamespace from "../../types/volume/namespace.js";

describe("materialVolumeToVertexData opaque rendering comparison", () => {
    test("given a 2x2x3 volume with air in middle layer, and the same volume with glass in middle layer, opaque render vertices should be identical", () => {
        // Create first volume: 2x2x3 with air in middle layer
        const size: Vec3 = [2, 2, 3];
        const capacity = size[0] * size[1] * size[2];
        
        const volumeWithAir: Volume<MaterialId> = {
            size,
            data: createTypedBuffer(MaterialId.schema, capacity),
        };
        
        // Initialize all to air
        for (let i = 0; i < capacity; i++) {
            volumeWithAir.data.set(i, Material.id.air);
        }
        
        // Fill bottom layer (z=0) with opaque materials
        const { concrete, steel, woodHard, rock } = Material.id;
        volumeWithAir.data.set(VolumeNamespace.index(volumeWithAir, 0, 0, 0), concrete);
        volumeWithAir.data.set(VolumeNamespace.index(volumeWithAir, 1, 0, 0), steel);
        volumeWithAir.data.set(VolumeNamespace.index(volumeWithAir, 0, 1, 0), woodHard);
        volumeWithAir.data.set(VolumeNamespace.index(volumeWithAir, 1, 1, 0), rock);
        
        // Middle layer (z=1) remains air
        
        // Fill top layer (z=2) with opaque materials
        const { iron, dirt, sand, granite } = Material.id;
        volumeWithAir.data.set(VolumeNamespace.index(volumeWithAir, 0, 0, 2), iron);
        volumeWithAir.data.set(VolumeNamespace.index(volumeWithAir, 1, 0, 2), dirt);
        volumeWithAir.data.set(VolumeNamespace.index(volumeWithAir, 0, 1, 2), sand);
        volumeWithAir.data.set(VolumeNamespace.index(volumeWithAir, 1, 1, 2), granite);
        
        // Create second volume: 2x2x3 with glass in middle layer (same structure otherwise)
        const volumeWithGlass: Volume<MaterialId> = {
            size,
            data: createTypedBuffer(MaterialId.schema, capacity),
        };
        
        // Initialize all to air
        for (let i = 0; i < capacity; i++) {
            volumeWithGlass.data.set(i, Material.id.air);
        }
        
        // Fill bottom layer (z=0) with same opaque materials
        volumeWithGlass.data.set(VolumeNamespace.index(volumeWithGlass, 0, 0, 0), concrete);
        volumeWithGlass.data.set(VolumeNamespace.index(volumeWithGlass, 1, 0, 0), steel);
        volumeWithGlass.data.set(VolumeNamespace.index(volumeWithGlass, 0, 1, 0), woodHard);
        volumeWithGlass.data.set(VolumeNamespace.index(volumeWithGlass, 1, 1, 0), rock);
        
        // Middle layer (z=1) - fill with glass (transparent)
        const { glass } = Material.id;
        volumeWithGlass.data.set(VolumeNamespace.index(volumeWithGlass, 0, 0, 1), glass);
        volumeWithGlass.data.set(VolumeNamespace.index(volumeWithGlass, 1, 0, 1), glass);
        volumeWithGlass.data.set(VolumeNamespace.index(volumeWithGlass, 0, 1, 1), glass);
        volumeWithGlass.data.set(VolumeNamespace.index(volumeWithGlass, 1, 1, 1), glass);
        
        // Fill top layer (z=2) with same opaque materials
        volumeWithGlass.data.set(VolumeNamespace.index(volumeWithGlass, 0, 0, 2), iron);
        volumeWithGlass.data.set(VolumeNamespace.index(volumeWithGlass, 1, 0, 2), dirt);
        volumeWithGlass.data.set(VolumeNamespace.index(volumeWithGlass, 0, 1, 2), sand);
        volumeWithGlass.data.set(VolumeNamespace.index(volumeWithGlass, 1, 1, 2), granite);
        
        // Generate opaque vertex data for both volumes (opaqueOnly: true)
        const vertexDataWithAir = materialVolumeToVertexData(volumeWithAir, { opaqueOnly: true });
        const vertexDataWithGlass = materialVolumeToVertexData(volumeWithGlass, { opaqueOnly: true });
        
        // Both should have the same number of vertices
        expect(vertexDataWithGlass.capacity).toBe(vertexDataWithAir.capacity);
        
        // Compare all vertices - they should be identical
        // Since opaqueOnly: true treats transparent materials as empty (same as air),
        // the opaque rendering should generate identical geometry
        for (let i = 0; i < vertexDataWithAir.capacity; i++) {
            const vertexAir = vertexDataWithAir.get(i);
            const vertexGlass = vertexDataWithGlass.get(i);
            
            // Compare position (allowing small floating point differences)
            expect(vertexGlass.position[0]).toBeCloseTo(vertexAir.position[0], 5);
            expect(vertexGlass.position[1]).toBeCloseTo(vertexAir.position[1], 5);
            expect(vertexGlass.position[2]).toBeCloseTo(vertexAir.position[2], 5);
            
            // Compare normal
            expect(vertexGlass.normal[0]).toBeCloseTo(vertexAir.normal[0], 5);
            expect(vertexGlass.normal[1]).toBeCloseTo(vertexAir.normal[1], 5);
            expect(vertexGlass.normal[2]).toBeCloseTo(vertexAir.normal[2], 5);
            
            // Compare material index (should be the same for corresponding faces)
            expect(vertexGlass.materialIndex).toBe(vertexAir.materialIndex);
        }
    });
});

