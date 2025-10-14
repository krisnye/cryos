import { Vec3 } from "@adobe/data/math"
import { TypedBuffer } from "@adobe/data/typed-buffer"

export type Volume<T> = {
    readonly size: Vec3,
    readonly data: TypedBuffer<T>
}

export namespace Volume {
    /**
     * Get the index of a voxel in a volume.
     * @param volume 
     * @param x 
     * @param y 
     * @param z 
     * @returns The index of the voxel.
     */
    export const index = <T>(volume: Volume<T>, x: number, y: number, z: number): number => {
        const [width, height] = volume.size;
        return x + width * (y + z * height);
    }

    export const create = <T>(volume: Volume<T>): Volume<T> => {
        return volume;
    }
}
