import { GraphicsContext } from "graphics/graphics-context.js";
import { createDatabaseSchema } from "@adobe/data/ecs";
import { Vec2, Vec2Schema, Vec3, Vec3Schema, Vec4, Vec4Schema } from "math/index.js";
import { createGraphicsDatabaseSchema } from "graphics/database/graphics-database.js";
import { ParticleSchema } from "../types/particle/particle.js";
import { TrueSchema } from "@adobe/data/schema";

export const createParticleDatabaseSchema = (context: GraphicsContext) => {
    const graphicsDatabaseSchema = createGraphicsDatabaseSchema(context);

    return createDatabaseSchema({
        ...graphicsDatabaseSchema.components,
        velocity: Vec3Schema,
        particle: TrueSchema,
        position: Vec3Schema,
        color: Vec4Schema,
    }, {
        ...graphicsDatabaseSchema.resources,
        mousePosition: Vec2Schema,
    }, (store) => {
        return ({ 
            ...graphicsDatabaseSchema.transactions(store),
            setMousePosition: (position: Vec2) => {
                store.resources.mousePosition = position;
            },
            setColor: ({ id, color }: { id: number, color: Vec4 }) => {
                store.update(id, { color });
            }
        })
    })
}


