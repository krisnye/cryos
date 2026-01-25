// © 2026 Adobe. MIT License. See /LICENSE for details.

import type { ColumnVolume } from "./column-volume.js";
import type { Volume } from "../volume.js";

/**
 * Type guard to check if a volume is a ColumnVolume.
 * @param volume The volume to check
 * @returns True if the volume is a ColumnVolume
 */
export const is = <T>(volume: Volume<T>): volume is ColumnVolume<T> => {
    return volume.type === "column";
};
