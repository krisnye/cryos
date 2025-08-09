import { GraphicsContext } from "graphics/graphics-context.js";
import { createDatabaseSchema } from "@adobe/data/ecs";
import { Vec2, Vec2Schema, Vec3Schema, Vec4 } from "math/index.js";
import { createGraphicsDatabaseSchema } from "graphics/database/graphics-database.js";
import { ParticleSchema } from "../types/particle/particle.js";

export const createParticleDatabaseSchema = (context: GraphicsContext) => {
    const graphicsDatabaseSchema = createGraphicsDatabaseSchema(context);

    return createDatabaseSchema(
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
        },
        {
            ...graphicsDatabaseSchema.transactions,
            setMousePosition: (t, position: Vec2) => {
                t.resources.mousePosition = position;
            },
            setParticleColor: (t, { id, color }: { id: number, color: Vec4 }) => {
                const entityValues  = t.read(id);
                if (entityValues) {
                    t.update(id, {
                        particle: {
                            ...entityValues.particle!,
                            color
                        }
                    });
                }
            }
        }
    );
}


