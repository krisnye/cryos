import { createDatabase } from "@adobe/data/ecs";
import { createGraphicsDatabaseTransactions } from "graphics/database/graphics-database.js";
import { Vec2, Vec4 } from "math/index.js";
import { ParticlesStore } from "./particles-store.js";
import { GraphicsContext } from "graphics/graphics-context.js";

const createParticleTransactions = (context: GraphicsContext) => {
    return {
        ...createGraphicsDatabaseTransactions(context),
        setMousePosition: (t: ParticlesStore, position: Vec2) => {
            t.resources.mousePosition = position;
        },
        setParticleColor: (t: ParticlesStore, { id, color }: { id: number, color: Vec4 }) => {
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
}

export const createParticleDatabase = (store: ParticlesStore, context: GraphicsContext) => {
    return createDatabase(store, createParticleTransactions(context));
}