import { Vec4 } from "@adobe/data/math";
import { VoxelEditorStore } from "../voxel-editor-store.js";
import { clearSelection } from "./clear-selection.js";
import { extrudeSelections } from "../functions/extrude-selections.js";
import { intrudeSelections } from "../functions/intrude-selections.js";
import { materials } from "physics/basic-materials.js";

export const keyPress = (t: VoxelEditorStore, { key }: { key: KeyboardEvent["key"] }) => {

    if (key === "Escape") {
        t.undoable = { coalesce: false };
        clearSelection(t);
    }

    if (key === "=") {
        t.undoable = { coalesce: false };
        const materialIndex = t.resources.selectedMaterial;
        const selectedMaterial = materials[materialIndex];
        const color: Vec4 = [...selectedMaterial.color] as Vec4;
        extrudeSelections(t, { color, material: materialIndex });
    }

    if (key === "-") {
        t.undoable = { coalesce: false };
        intrudeSelections(t);
    }
};
