// Combined volume model rendering plugin
// Note: Rendering is now handled by material-vertex-buffer-renderer (generic, not volume-specific)
// This plugin is kept for backward compatibility but no longer includes renderers or buffer generation
// All volume-specific rendering logic has been migrated to the new architecture
import { Database } from "@adobe/data/ecs";

export const volumeModelRendering = Database.Plugin.create({
    // Empty plugin - rendering moved to material-vertex-buffer-renderer
    // Buffer generation moved to material-volume-to-vertex-buffers
    // Keeping this export for backward compatibility
});
