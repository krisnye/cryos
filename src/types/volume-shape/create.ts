import { U8 } from "@adobe/data/math";
import { createTypedBuffer } from "@adobe/data/typed-buffer";
import { Aabb } from "types/aabb/index.js";
import { DenseVolume } from "../dense-volume/dense-volume.js";
import { Volume } from "../volume/volume.js";
import type { VolumeShape } from "./volume-shape.js";
import { Voxel } from "./voxel/voxel.js";

const isFilled = (volume: Volume<boolean>, x: number, y: number, z: number): boolean =>
    Volume.get(volume, x, y, z) === true;

const boundaryMask = (width: number, height: number, depth: number, x: number, y: number, z: number): number => {
    let mask = 0;
    if (x === 0) {
        mask |= Aabb.Face.NEG_X;
    }
    if (x === width - 1) {
        mask |= Aabb.Face.POS_X;
    }
    if (y === 0) {
        mask |= Aabb.Face.NEG_Y;
    }
    if (y === height - 1) {
        mask |= Aabb.Face.POS_Y;
    }
    if (z === 0) {
        mask |= Aabb.Face.NEG_Z;
    }
    if (z === depth - 1) {
        mask |= Aabb.Face.POS_Z;
    }
    return mask;
};

const isInterior = (volume: Volume<boolean>, width: number, height: number, depth: number, x: number, y: number, z: number): boolean => {
    if (x <= 0 || x >= width - 1 || y <= 0 || y >= height - 1 || z <= 0 || z >= depth - 1) {
        return false;
    }
    return (
        isFilled(volume, x + 1, y, z) &&
        isFilled(volume, x - 1, y, z) &&
        isFilled(volume, x, y + 1, z) &&
        isFilled(volume, x, y - 1, z) &&
        isFilled(volume, x, y, z + 1) &&
        isFilled(volume, x, y, z - 1)
    );
};

/**
 * Builds a dense `VolumeShape` from occupancy: `true` is filled, `false` / missing is empty.
 * Sets `Aabb.Face` bits for volume-box adjacency, `Voxel.FULL` when filled, and `Voxel.INTERIOR`
 * when all six in-bounds orthogonal neighbors are filled.
 */
export const create = (volume: Volume<boolean>): VolumeShape => {
    const [width, height, depth] = volume.size;
    const capacity = width * height * depth;
    const data = createTypedBuffer(U8.schema, capacity);

    const shape: VolumeShape = DenseVolume.create({
        size: volume.size,
        data,
    });

    for (let z = 0; z < depth; z++) {
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                let flags = boundaryMask(width, height, depth, x, y, z);
                if (isFilled(volume, x, y, z)) {
                    flags |= Voxel.FULL;
                    if (isInterior(volume, width, height, depth, x, y, z)) {
                        flags |= Voxel.INTERIOR;
                    }
                }
                const index = DenseVolume.getIndex(shape, x, y, z);
                data.set(index, flags);
            }
        }
    }

    return shape;
};
