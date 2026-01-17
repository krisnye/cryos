// Combined volume model rendering plugin
// Combines all volume model rendering systems into a single plugin
import { Database } from "@adobe/data/ecs";
import { renderVolumeModels } from "./render-volume-models.js";
// Transparent rendering temporarily disabled for investigation
// import { renderVolumeModelsTransparent } from "./render-volume-models-transparent.js";

export const volumeModelRendering = Database.Plugin.combine(
    renderVolumeModels
    // Transparent rendering temporarily disabled for investigation
    // renderVolumeModelsTransparent
);
