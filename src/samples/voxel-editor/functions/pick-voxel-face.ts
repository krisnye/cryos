import { AabbFace, Vec2, Vec3 } from "@adobe/data/math";
import { Entity } from "@adobe/data/ecs";
import { VoxelEditorStore } from "../voxel-editor-store.js";
import { pickFromViewport } from "graphics/picking/pick-from-viewport.js";

export const pickVoxelFace = (
    t: VoxelEditorStore,
    { viewportPosition, viewportId }: { viewportPosition: Vec2; viewportId: Entity }
): { position: Vec3; face: AabbFace } | null => {
    const pickResult = pickFromViewport({
        store: t,
        viewportPosition,
        viewportId,
        tables: t.queryArchetypes(["id", "position", "pickable"])
    });
    
    if (!pickResult) {
        return null;
    }
    
    const pickable = t.read(pickResult.entity, t.archetypes.Pickable);
    if (!pickable || !pickResult.modelPosition) {
        return null;
    }
    
    const face = AabbFace.fromPosition(pickResult.modelPosition);
    return { position: pickable.position, face };
};

