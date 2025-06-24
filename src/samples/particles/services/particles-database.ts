import { GraphicsContext } from "graphics/graphics-context.js";
import { createDatabaseSchema } from "@adobe/data/ecs";
import { Vec3, Vec3Schema } from "math/index.js";

export const createGraphicsDatabaseSchema = (context: GraphicsContext) => {
    return createDatabaseSchema({
        position: Vec3Schema,
        velocity: Vec3Schema,
    }, {
    }, (store) => {
        const particleArchetype = store.ensureArchetype(["id", "position", "velocity"]);
        return ({
            createParticle: ({ position, velocity }: { position: Vec3, velocity: Vec3 }) => {
                return particleArchetype.insert({ position, velocity });
            }
        })
    })
}


