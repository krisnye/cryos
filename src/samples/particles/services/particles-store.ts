import { GraphicsContext } from "graphics/graphics-context.js";
import { createStore, createStoreSchema } from "@adobe/data/ecs";
import { Vec2, Vec2Schema, Vec3Schema, Vec4 } from "math/index.js";
import { createGraphicsStoreSchema } from "graphics/database/graphics-database.js";
import { ParticleSchema } from "../types/particle/particle.js";

const createParticlesStoreSchema = (context: GraphicsContext) => {
    const graphicsDatabaseSchema = createGraphicsStoreSchema(context);

    return createStoreSchema(
        {
            ...graphicsDatabaseSchema.components,
            velocity: Vec3Schema,
            particle: ParticleSchema,
        },
        {
            ...graphicsDatabaseSchema.resources,
            mousePosition: Vec2Schema,
        },
        {
            ...graphicsDatabaseSchema.archetypes,
            Particle: ["particle", "velocity", "boundingBox"],
        }
    );
}

export const createParticlesStore = (context: GraphicsContext) => {
    const schema = createParticlesStoreSchema(context);
    return createStore(schema.components, schema.resources, schema.archetypes);
}

export type ParticlesStore = ReturnType<typeof createParticlesStore>;
