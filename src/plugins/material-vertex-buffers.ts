import { Database } from "@adobe/data/ecs";

/**
 * Data-only plugin that defines vertex buffer components for material-based rendering.
 * Generic enough to work with any vertex buffer source (volumes, loaded geometry, etc.)
 */
export const materialVertexBuffers = Database.Plugin.create({
    components: {
        opaqueVertexBuffer: { default: null as unknown as GPUBuffer, transient: true },
        transparentVertexBuffer: { default: null as unknown as GPUBuffer, transient: true },
    },
});

