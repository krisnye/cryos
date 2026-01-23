import { Vec3 } from "@adobe/data/math";
import { createTypedBuffer } from "@adobe/data/typed-buffer";
import { DenseVolume } from "../../types/dense-volume/dense-volume.js";
import { MaterialId } from "../../types/material/material-id.js";
import { Material } from "../../types/index.js";
import * as DenseVolumeNamespace from "../../types/dense-volume/namespace.js";

/**
 * Creates a 16x16x16 house chunk volume (4m x 4m x 4m at 25cm per voxel)
 * Contains foundation, walls, windows, roof, and interior details
 */
export function createHouseChunkVolume(): DenseVolume<MaterialId> {
    const size: Vec3 = [16, 16, 16];
    const capacity = size[0] * size[1] * size[2];
    const volume: DenseVolume<MaterialId> = {
        type: "dense",
        size,
        data: createTypedBuffer(MaterialId.schema, capacity),
    };
    
    // Initialize all voxels to air (0)
    for (let i = 0; i < capacity; i++) {
        volume.data.set(i, Material.id.air);
    }
    
    // Material IDs for convenience
    const { air, concrete, reinforcedConcrete, woodHard, glass, steel } = Material.id;
    
    // Foundation layer (z=0,1) - reinforced concrete
    for (let z = 0; z < 2; z++) {
        for (let y = 0; y < 16; y++) {
            for (let x = 0; x < 16; x++) {
                const index = DenseVolumeNamespace.index(volume, x, y, z);
                volume.data.set(index, reinforcedConcrete);
            }
        }
    }
    
    // Ground floor walls (z=2-8, height 7 voxels = 1.75m)
    // Outer walls
    for (let z = 2; z < 9; z++) {
        // Front wall (y=0)
        for (let x = 0; x < 16; x++) {
            const index = DenseVolumeNamespace.index(volume, x, 0, z);
            volume.data.set(index, concrete);
        }
        // Back wall (y=15)
        for (let x = 0; x < 16; x++) {
            const index = DenseVolumeNamespace.index(volume, x, 15, z);
            volume.data.set(index, concrete);
        }
        // Left wall (x=0)
        for (let y = 0; y < 16; y++) {
            const index = DenseVolumeNamespace.index(volume, 0, y, z);
            volume.data.set(index, concrete);
        }
        // Right wall (x=15)
        for (let y = 0; y < 16; y++) {
            const index = DenseVolumeNamespace.index(volume, 15, y, z);
            volume.data.set(index, concrete);
        }
    }
    
    // Large windows on front wall (y=0) at z=3-7 (larger, eye level)
    for (let z = 3; z < 8; z++) {
        // Left window (x=2-7, 6 voxels wide)
        for (let x = 2; x < 8; x++) {
            const index = DenseVolumeNamespace.index(volume, x, 0, z);
            volume.data.set(index, glass);
        }
        // Right window (x=8-13, 6 voxels wide)
        for (let x = 8; x < 14; x++) {
            const index = DenseVolumeNamespace.index(volume, x, 0, z);
            volume.data.set(index, glass);
        }
    }
    
    // Large windows on back wall (y=15) at z=3-7
    for (let z = 3; z < 8; z++) {
        // Left window (x=2-7)
        for (let x = 2; x < 8; x++) {
            const index = DenseVolumeNamespace.index(volume, x, 15, z);
            volume.data.set(index, glass);
        }
        // Right window (x=8-13)
        for (let x = 8; x < 14; x++) {
            const index = DenseVolumeNamespace.index(volume, x, 15, z);
            volume.data.set(index, glass);
        }
    }
    
    // Windows on left wall (x=0) at z=3-7
    for (let z = 3; z < 8; z++) {
        // Front window (y=2-7)
        for (let y = 2; y < 8; y++) {
            const index = DenseVolumeNamespace.index(volume, 0, y, z);
            volume.data.set(index, glass);
        }
        // Back window (y=8-13)
        for (let y = 8; y < 14; y++) {
            const index = DenseVolumeNamespace.index(volume, 0, y, z);
            volume.data.set(index, glass);
        }
    }
    
    // Windows on right wall (x=15) at z=3-7
    for (let z = 3; z < 8; z++) {
        // Front window (y=2-7)
        for (let y = 2; y < 8; y++) {
            const index = DenseVolumeNamespace.index(volume, 15, y, z);
            volume.data.set(index, glass);
        }
        // Back window (y=8-13)
        for (let y = 8; y < 14; y++) {
            const index = DenseVolumeNamespace.index(volume, 15, y, z);
            volume.data.set(index, glass);
        }
    }
    
    // Interior wall dividing the space (x=8, from y=4 to y=12)
    for (let z = 2; z < 9; z++) {
        for (let y = 4; y < 12; y++) {
            const index = DenseVolumeNamespace.index(volume, 8, y, z);
            volume.data.set(index, concrete);
        }
    }
    
    // Door opening in interior wall (x=8, y=6-8, z=2-6)
    for (let z = 2; z < 7; z++) {
        for (let y = 6; y < 9; y++) {
            const index = DenseVolumeNamespace.index(volume, 8, y, z);
            volume.data.set(index, air);
        }
    }
    
    // Second floor floor (z=8)
    for (let y = 0; y < 16; y++) {
        for (let x = 0; x < 16; x++) {
            const index = DenseVolumeNamespace.index(volume, x, y, 8);
            volume.data.set(index, woodHard);
        }
    }
    
    // Second floor walls (z=9-13, height 5 voxels = 1.25m)
    for (let z = 9; z < 14; z++) {
        // Front wall (y=0) with windows
        for (let x = 0; x < 16; x++) {
            if (x < 4 || x >= 12) {
                const index = DenseVolumeNamespace.index(volume, x, 0, z);
                volume.data.set(index, concrete);
            }
        }
        // Back wall (y=15)
        for (let x = 0; x < 16; x++) {
            const index = DenseVolumeNamespace.index(volume, x, 15, z);
            volume.data.set(index, concrete);
        }
        // Left wall (x=0)
        for (let y = 0; y < 16; y++) {
            const index = DenseVolumeNamespace.index(volume, 0, y, z);
            volume.data.set(index, concrete);
        }
        // Right wall (x=15)
        for (let y = 0; y < 16; y++) {
            const index = DenseVolumeNamespace.index(volume, 15, y, z);
            volume.data.set(index, concrete);
        }
    }
    
    // Large windows on second floor front wall (y=0) at z=9-13
    for (let z = 9; z < 14; z++) {
        // Left window (x=2-7)
        for (let x = 2; x < 8; x++) {
            const index = DenseVolumeNamespace.index(volume, x, 0, z);
            volume.data.set(index, glass);
        }
        // Right window (x=8-13)
        for (let x = 8; x < 14; x++) {
            const index = DenseVolumeNamespace.index(volume, x, 0, z);
            volume.data.set(index, glass);
        }
    }
    
    // Large windows on second floor back wall (y=15) at z=9-13
    for (let z = 9; z < 14; z++) {
        // Left window (x=2-7)
        for (let x = 2; x < 8; x++) {
            const index = DenseVolumeNamespace.index(volume, x, 15, z);
            volume.data.set(index, glass);
        }
        // Right window (x=8-13)
        for (let x = 8; x < 14; x++) {
            const index = DenseVolumeNamespace.index(volume, x, 15, z);
            volume.data.set(index, glass);
        }
    }
    
    // Windows on second floor left wall (x=0) at z=9-13
    for (let z = 9; z < 14; z++) {
        // Front window (y=2-7)
        for (let y = 2; y < 8; y++) {
            const index = DenseVolumeNamespace.index(volume, 0, y, z);
            volume.data.set(index, glass);
        }
        // Back window (y=8-13)
        for (let y = 8; y < 14; y++) {
            const index = DenseVolumeNamespace.index(volume, 0, y, z);
            volume.data.set(index, glass);
        }
    }
    
    // Windows on second floor right wall (x=15) at z=9-13
    for (let z = 9; z < 14; z++) {
        // Front window (y=2-7)
        for (let y = 2; y < 8; y++) {
            const index = DenseVolumeNamespace.index(volume, 15, y, z);
            volume.data.set(index, glass);
        }
        // Back window (y=8-13)
        for (let y = 8; y < 14; y++) {
            const index = DenseVolumeNamespace.index(volume, 15, y, z);
            volume.data.set(index, glass);
        }
    }
    
    // Roof (z=14-15, sloping)
    // Flat roof for simplicity
    for (let z = 14; z < 16; z++) {
        for (let y = 0; y < 16; y++) {
            for (let x = 0; x < 16; x++) {
                const index = DenseVolumeNamespace.index(volume, x, y, z);
                volume.data.set(index, woodHard);
            }
        }
    }
    
    // Add some structural beams (steel) in corners
    for (let z = 2; z < 14; z++) {
        // Corner beams
        volume.data.set(DenseVolumeNamespace.index(volume, 0, 0, z), steel);
        volume.data.set(DenseVolumeNamespace.index(volume, 15, 0, z), steel);
        volume.data.set(DenseVolumeNamespace.index(volume, 0, 15, z), steel);
        volume.data.set(DenseVolumeNamespace.index(volume, 15, 15, z), steel);
    }
    
    return volume;
}

