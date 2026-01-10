import { Database } from "@adobe/data/ecs";
import { geometry } from "./geometry.js";
import { True } from "@adobe/data/schema";
import { material } from "./material.js";

export const particle = Database.Plugin.create({
    components: {
        particle: True.schema,
    },
    archetypes: {
        Particle: ["particle", "position", "material", "scale", "rotation"],
    },
    extends: Database.Plugin.combine(geometry, material)
})
