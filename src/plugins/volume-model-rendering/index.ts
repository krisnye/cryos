// Combined volume model rendering plugin
// Combines all volume model rendering systems into a single plugin
import { Database } from "@adobe/data/ecs";
import { renderVolumeModels } from "./render-volume-models.js";
import { renderVolumeModelsTransparent } from "./render-volume-models-transparent.js";

export const volumeModelRendering = Database.Plugin.combine(
    renderVolumeModels,
    renderVolumeModelsTransparent
);
