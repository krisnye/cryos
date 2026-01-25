import { DenseVolume } from "../dense-volume/dense-volume.js";
import { Material } from "../material/material.js";

/**
 * A dense volume containing material IDs.
 */
export type DenseVolumeMaterial = DenseVolume<Material.Id>;

export * as DenseVolumeMaterial from "./namespace.js";
