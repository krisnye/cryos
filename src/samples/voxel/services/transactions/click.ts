import { VoxelStore } from "../voxel-store.js";
import { toggleSelection } from "./toggle-selection.js";

export const click = (t: VoxelStore) => {
    toggleSelection(t);
};
