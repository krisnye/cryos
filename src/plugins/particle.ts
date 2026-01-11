import { Database } from "@adobe/data/ecs";
import { True } from "@adobe/data/schema";
import { physics } from "./physics/physics.js";
import { Material } from "../types/index.js";

export const particle = Database.Plugin.create({
    components: {
        particle: True.schema,
    },
    archetypes: {
        Particle: ["particle", "position", "material"],
    },
    transactions: {
        createAxis(t) {
            const size = 2;
            
            // Red particle on X-axis
            t.archetypes.Particle.insert({
                particle: true,
                position: [size / 2, 0, 0],
                material: Material.id["meta-red"]
            });
            
            // Green particle on Y-axis
            t.archetypes.Particle.insert({
                particle: true,
                position: [0, size / 2, 0],
                material: Material.id["meta-green"]
            });
            
            // Blue particle on Z-axis
            t.archetypes.Particle.insert({
                particle: true,
                position: [0, 0, size / 2],
                material: Material.id["meta-blue"]
            });
        },
    },
    extends: physics
})
