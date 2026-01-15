// Combined particle rendering plugin
// Combines all particle rendering variants into a single plugin
import { Database } from "@adobe/data/ecs";
import { particleRenderingBase } from "./particle-rendering-base.js";
import { particleRenderingScale } from "./particle-rendering-scale.js";
import { particleRenderingRotation } from "./particle-rendering-rotation.js";
import { particleRenderingScaleRotation } from "./particle-rendering-scale-rotation.js";

export const particleRendering = Database.Plugin.combine(
    particleRenderingBase,
    particleRenderingScale,
    particleRenderingRotation,
    particleRenderingScaleRotation
);
