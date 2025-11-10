import { Entity } from "@adobe/data/ecs";
import { Mat4x4, Vec2, Vec3 } from "@adobe/data/math";
import { Table } from "@adobe/data/table";
import { GraphicsStore } from "graphics/database/graphics-store.js";
import { Camera } from "graphics/index.js";
import { PickResult } from "graphics/picking/pick-result.js";
import { pick } from "graphics/picking/pick.js";

/**
 * Picks a particle from a screen position using spatial mapping.
 * @param store - The voxel store containing particles and resources
 * @param screenPosition - The screen position as Vec2 [x, y]
 * @returns The picked result with entity, position, and face, or null if nothing picked
 */
export const pickFromViewport = (props: {
    store: GraphicsStore,
    viewportPosition: Vec2,
    viewportId: Entity,
    tables?: readonly Table<{ id: Entity, position: Vec3 }>[]
}): PickResult | null => {
    const { store, viewportPosition, viewportId, tables = store.queryArchetypes(["id", "position"]) } = props;
    const viewport = store.read(viewportId, store.archetypes.Viewport)!;
    const camera = viewport.camera;
    const canvasWidth = viewport.context.canvas.width;
    const canvasHeight = viewport.context.canvas.height;

    // Compute the inverse view-projection matrix
    const viewProjection = Camera.toViewProjection(camera);
    const invViewProjection = Mat4x4.inverse(viewProjection);

    // Convert screen position to world space pick line
    const line = Camera.screenToWorldRay(viewportPosition, invViewProjection, canvasWidth, canvasHeight);
    const picked = pick({ store, tables, line, radius: 0 });

    return picked[0] ?? null;
}; 