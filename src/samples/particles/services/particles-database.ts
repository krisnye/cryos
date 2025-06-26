import { GraphicsContext } from "graphics/graphics-context.js";
import { createDatabaseSchema } from "@adobe/data/ecs";
import { Vec3, Vec3Schema, Vec4 } from "math/index.js";
import { createGraphicsDatabaseSchema } from "graphics/database/graphics-database.js";
import { ParticleSchema } from "../types/Particle.js";

export const createParticleDatabaseSchema = (context: GraphicsContext) => {
    const graphicsDatabaseSchema = createGraphicsDatabaseSchema(context);

    return createDatabaseSchema({
        ...graphicsDatabaseSchema.components,
        velocity: Vec3Schema,
        particle: ParticleSchema,
    }, {
        ...graphicsDatabaseSchema.resources,
    }, (store) => {
        const particleArchetype = store.ensureArchetype(["id", "particle", "velocity"]);
        return ({ 
            ...graphicsDatabaseSchema.transactions(store),
            createParticle: ({ position, velocity, color }: { position: Vec3, velocity: Vec3, color: Vec4 }) => {
                return particleArchetype.insert({ particle: { position, color }, velocity });
            }
        })
    })
}


