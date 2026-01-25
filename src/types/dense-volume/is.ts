
import type { DenseVolume } from "./dense-volume.js";
import type { Volume } from "../volume/volume.js";

/**
 * Type guard to check if a volume is a DenseVolume.
 * @param volume The volume to check
 * @returns True if the volume is a DenseVolume
 */
export const is = <T>(volume: Volume<T>): volume is DenseVolume<T> => {
    return volume.type === "dense";
};

