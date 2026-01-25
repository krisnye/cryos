import { DenseVolume } from "../dense-volume/dense-volume.js";
import { ColumnVolume } from "../column-volume/column-volume.js";

export type Volume<T> = DenseVolume<T> | ColumnVolume<T>;

