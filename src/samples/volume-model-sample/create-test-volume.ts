import { Vec3 } from "@adobe/data/math";
import { createTypedBuffer } from "@adobe/data/typed-buffer";
import { Volume } from "../../types/volume/volume.js";
import { MaterialId } from "../../types/material/material-id.js";
import { Material } from "../../types/index.js";
import * as VolumeNamespace from "../../types/volume/namespace.js";

/**
 * Creates a simple 2x2x3 test volume with unique materials for each voxel.
 * Used for testing and debugging volume rendering, especially bottom faces.
 * 
 * Structure:
 * - Bottom layer (z=0): 4 solid voxels
 * - Middle layer (z=1): all glass (transparent)
 * - Top layer (z=2): 4 solid voxels
 * 
 * Voxel material mapping:
 * Bottom layer (z=0):
 * - [0,0,0] → concrete
 * - [1,0,0] → steel
 * - [0,1,0] → woodHard
 * - [1,1,0] → rock
 * 
 * Middle layer (z=1): all glass (transparent)
 * 
 * Top layer (z=2):
 * - [0,0,2] → iron
 * - [1,0,2] → dirt
 * - [0,1,2] → sand
 * - [1,1,2] → granite
 */
export function createTestVolume2x2x2(): Volume<MaterialId> {
    const size: Vec3 = [2, 2, 3];
    const capacity = size[0] * size[1] * size[2];
    const volume: Volume<MaterialId> = {
        size,
        data: createTypedBuffer(MaterialId.schema, capacity),
    };

    // Initialize all voxels to air (0)
    for (let i = 0; i < capacity; i++) {
        volume.data.set(i, Material.id.air);
    }

    // Material IDs for the voxels
    const { concrete, steel, woodHard, rock, iron, dirt, sand, granite, glass } = Material.id;

    // Fill bottom layer (z=0) with unique materials
    volume.data.set(VolumeNamespace.index(volume, 0, 0, 0), concrete);
    volume.data.set(VolumeNamespace.index(volume, 1, 0, 0), steel);
    volume.data.set(VolumeNamespace.index(volume, 0, 1, 0), woodHard);
    volume.data.set(VolumeNamespace.index(volume, 1, 1, 0), rock);

    // Middle layer (z=1) - fill with glass (transparent)
    volume.data.set(VolumeNamespace.index(volume, 0, 0, 1), glass);
    volume.data.set(VolumeNamespace.index(volume, 1, 0, 1), glass);
    volume.data.set(VolumeNamespace.index(volume, 0, 1, 1), glass);
    volume.data.set(VolumeNamespace.index(volume, 1, 1, 1), glass);

    // Fill top layer (z=2) with unique materials
    volume.data.set(VolumeNamespace.index(volume, 0, 0, 2), iron);
    volume.data.set(VolumeNamespace.index(volume, 1, 0, 2), dirt);
    volume.data.set(VolumeNamespace.index(volume, 0, 1, 2), sand);
    volume.data.set(VolumeNamespace.index(volume, 1, 1, 2), granite);

    return volume;
}

