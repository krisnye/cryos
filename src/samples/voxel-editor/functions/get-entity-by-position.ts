import { Entity } from "@adobe/data/ecs";
import { VoxelEditorStore } from "../voxel-editor-store.js";
import { Vec3 } from "@adobe/data/math";

export const getEntityByPosition = <T extends readonly string[] | ReadonlySet<string>>(
    t: VoxelEditorStore,
    position: Vec3,
    components: T
): Entity | null => {
    for (const table of t.queryArchetypes(components as any)) {
        for (let i = 0; i < table.rowCount; i++) {
            if (Vec3.equals(position, table.columns.position.get(i))) {
                return table.columns.id.get(i);
            }
        }
    }
    return null;
};

