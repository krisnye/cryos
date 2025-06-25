import { GraphicsContext } from "graphics/graphics-context.js";
import { createDatabaseSchema } from "@adobe/data/ecs";
import { Vec3, Vec3Schema } from "math/index.js";
import { createGraphicsDatabaseSchema } from "graphics/database/graphics-database.js";
import { TrueSchema } from "@adobe/data/schema";

export const createParticleDatabaseSchema = (context: GraphicsContext) => {
    const graphicsDatabaseSchema = createGraphicsDatabaseSchema(context);

    return createDatabaseSchema({
        ...graphicsDatabaseSchema.components,
        position: Vec3Schema,
        velocity: Vec3Schema,
        particle: TrueSchema,
    }, {
        ...graphicsDatabaseSchema.resources,
    }, (store) => {
        const particleArchetype = store.ensureArchetype(["id", "position", "velocity"]);
        return ({ 
            ...graphicsDatabaseSchema.transactions(store),
            createParticle: ({ position, velocity }: { position: Vec3, velocity: Vec3 }) => {
                return particleArchetype.insert({ position, velocity });
            }
        })
    })
}


