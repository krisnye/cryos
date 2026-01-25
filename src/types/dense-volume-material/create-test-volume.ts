import { Vec3 } from "@adobe/data/math";
import { createTypedBuffer } from "@adobe/data/typed-buffer";
import { DenseVolume } from "../dense-volume/dense-volume.js";
import { Material } from "../material/material.js";
import type { DenseVolumeMaterial } from "./dense-volume-material.js";

/**
 * Creates a simple 2x2x3 test volume with unique materials for each voxel.
 * Used for testing and debugging volume rendering, especially bottom faces.
 *
 * Structure:
 * - Bottom layer (z=0): 4 solid voxels (concrete, steel, woodHard, rock)
 * - Middle layer (z=1): air or glass depending on options
 * - Top layer (z=2): 4 solid voxels (iron, dirt, sand, granite)
 *
 * @param options.middleLayer - 'air' or 'glass' (default 'glass')
 */
export const createTestVolume = (options: { middleLayer?: "air" | "glass" } = {}): DenseVolumeMaterial => {
    const { middleLayer = "glass" } = options;
    const size: Vec3 = [2, 2, 3];
    const capacity = size[0] * size[1] * size[2];
    const volume: DenseVolumeMaterial = {
        type: "dense",
        size,
        data: createTypedBuffer(Material.Id.schema, capacity),
    };

    for (let i = 0; i < capacity; i++) {
        volume.data.set(i, Material.ids.air);
    }

    const { concrete, steel, woodHard, rock, iron, dirt, sand, granite, glass } = Material.ids;

    volume.data.set(DenseVolume.getIndex(volume, 0, 0, 0), concrete);
    volume.data.set(DenseVolume.getIndex(volume, 1, 0, 0), steel);
    volume.data.set(DenseVolume.getIndex(volume, 0, 1, 0), woodHard);
    volume.data.set(DenseVolume.getIndex(volume, 1, 1, 0), rock);

    if (middleLayer === "glass") {
        volume.data.set(DenseVolume.getIndex(volume, 0, 0, 1), glass);
        volume.data.set(DenseVolume.getIndex(volume, 1, 0, 1), glass);
        volume.data.set(DenseVolume.getIndex(volume, 0, 1, 1), glass);
        volume.data.set(DenseVolume.getIndex(volume, 1, 1, 1), glass);
    }

    volume.data.set(DenseVolume.getIndex(volume, 0, 0, 2), iron);
    volume.data.set(DenseVolume.getIndex(volume, 1, 0, 2), dirt);
    volume.data.set(DenseVolume.getIndex(volume, 0, 1, 2), sand);
    volume.data.set(DenseVolume.getIndex(volume, 1, 1, 2), granite);

    return volume;
};

