// Shared dependencies for particle rendering plugins
import { Database } from "@adobe/data/ecs";
import { particle } from "../particle.js";
import { materials } from "../materials.js";
import { scene } from "../scene.js";
import { transparent } from "../transparent.js";

export const particleRenderingBaseDependencies = Database.Plugin.combine(
    particle,
    materials,
    scene,
    transparent
);

