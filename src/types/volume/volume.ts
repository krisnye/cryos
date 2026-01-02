import { Vec3 } from "@adobe/data/math";
import { TypedBuffer } from "@adobe/data/typed-buffer";

export type Volume<T> = {
    readonly size: Vec3;
    readonly data: TypedBuffer<T>;
};


export namespace Volume {
    
    export type Index = number;
    
    /**
     * Get the index of a voxel in a volume.
     * @param volume 
     * @param x 
     * @param y 
     * @param z 
     * @returns The index of the voxel.
     */
    export const index = <T>(volume: Volume<T>, x: number, y: number, z: number): Index => {
        const [width, height] = volume.size;
        return x + width * (y + z * height);
    };

    export const coordinates = <T>(volume: Volume<T>, index: Index): Vec3 => {
        const [width, height] = volume.size;
        const z = Math.floor(index / (width * height));
        const y = Math.floor((index % (width * height)) / width);
        const x = index % width;
        return [x, y, z];
    };

    export const create = <T>(volume: Volume<T>): Volume<T> => {
        return volume;
    };
}

