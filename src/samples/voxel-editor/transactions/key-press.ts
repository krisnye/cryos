import { Vec4 } from "@adobe/data/math";
import { VoxelEditorStore } from "../voxel-editor-store.js";
import { clearSelection } from "./clear-selection.js";
import { extrudeSelections } from "../functions/extrude-selections.js";
import { intrudeSelections } from "../functions/intrude-selections.js";

const DEFAULT_VOXEL_COLOR: Vec4 = [1, 1, 1, 1];

export const keyPress = (t: VoxelEditorStore, { key }: { key: KeyboardEvent["key"] }) => {

    if (key === "Escape") {
        clearSelection(t);
    }

    if (key === "=") {
        extrudeSelections(t, { color: DEFAULT_VOXEL_COLOR });
    }

    if (key === "-") {
        intrudeSelections(t);
    }
};
