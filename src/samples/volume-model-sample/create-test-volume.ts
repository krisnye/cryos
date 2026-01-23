import { Vec3 } from "@adobe/data/math";
import { createTypedBuffer } from "@adobe/data/typed-buffer";
import { DenseVolume } from "../../types/dense-volume/dense-volume.js";
import { MaterialId } from "../../types/material/material-id.js";
import { Material } from "../../types/index.js";
import * as DenseVolumeNamespace from "../../types/dense-volume/namespace.js";

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
export function createTestVolume2x2x2(options: { middleLayer?: "air" | "glass" } = {}): DenseVolume<MaterialId> {
    const { middleLayer = "glass" } = options;
    const size: Vec3 = [2, 2, 3];
    const capacity = size[0] * size[1] * size[2];
    const volume: DenseVolume<MaterialId> = {
        type: "dense",
        size,
        data: createTypedBuffer(MaterialId.schema, capacity),
    };

    for (let i = 0; i < capacity; i++) {
        volume.data.set(i, Material.id.air);
    }

    const { concrete, steel, woodHard, rock, iron, dirt, sand, granite, glass } = Material.id;

    volume.data.set(DenseVolumeNamespace.index(volume, 0, 0, 0), concrete);
    volume.data.set(DenseVolumeNamespace.index(volume, 1, 0, 0), steel);
    volume.data.set(DenseVolumeNamespace.index(volume, 0, 1, 0), woodHard);
    volume.data.set(DenseVolumeNamespace.index(volume, 1, 1, 0), rock);

    if (middleLayer === "glass") {
        volume.data.set(DenseVolumeNamespace.index(volume, 0, 0, 1), glass);
        volume.data.set(DenseVolumeNamespace.index(volume, 1, 0, 1), glass);
        volume.data.set(DenseVolumeNamespace.index(volume, 0, 1, 1), glass);
        volume.data.set(DenseVolumeNamespace.index(volume, 1, 1, 1), glass);
    }

    volume.data.set(DenseVolumeNamespace.index(volume, 0, 0, 2), iron);
    volume.data.set(DenseVolumeNamespace.index(volume, 1, 0, 2), dirt);
    volume.data.set(DenseVolumeNamespace.index(volume, 0, 1, 2), sand);
    volume.data.set(DenseVolumeNamespace.index(volume, 1, 1, 2), granite);

    return volume;
}

