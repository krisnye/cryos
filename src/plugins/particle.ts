import { Database } from "@adobe/data/ecs";
import { True } from "@adobe/data/schema";
import { physics } from "./physics/physics.js";

export const particle = Database.Plugin.create({
    components: {
        particle: True.schema,
    },
    archetypes: {
        Particle: ["particle", "position", "material"],
    },
    extends: physics
})
