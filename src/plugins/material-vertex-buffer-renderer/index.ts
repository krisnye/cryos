import { Database } from "@adobe/data/ecs";
import { renderOpaqueVertexBuffers } from "./opaque-vertex-buffer-renderer.js";
import { renderTransparentVertexBuffers } from "./transparent-vertex-buffer-renderer.js";

/**
 * Generic material vertex buffer renderer plugin.
 * Renders any entity with opaqueVertexBuffer or transparentVertexBuffer components.
 * Works with volumes, loaded geometry, procedural meshes, etc.
 */
export const materialVertexBufferRenderer = Database.Plugin.combine(
    renderOpaqueVertexBuffers,
    renderTransparentVertexBuffers
);

