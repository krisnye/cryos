// Combined transparent particle rendering plugin
// Combines all transparent particle rendering variants into a single plugin
import { Database } from "@adobe/data/ecs";
import { particleRenderingTransparentBase } from "./particle-rendering-transparent-base.js";
import { particleRenderingTransparentScale } from "./particle-rendering-transparent-scale.js";
import { particleRenderingTransparentRotation } from "./particle-rendering-transparent-rotation.js";
import { particleRenderingTransparentScaleRotation } from "./particle-rendering-transparent-scale-rotation.js";

export const particleRenderingTransparent = Database.Plugin.combine(
    particleRenderingTransparentBase,
    particleRenderingTransparentScale,
    particleRenderingTransparentRotation,
    particleRenderingTransparentScaleRotation
);

