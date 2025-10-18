import { createStoreSchema, StoreFromSchema } from "@adobe/data/ecs";
import { Vec2, Vec3 } from "@adobe/data/math";
import { TrueSchema } from "@adobe/data/schema";
import { GraphicsStore, graphicsStoreSchema } from "graphics/database/index.js";

export const helloModelStoreSchemaVersion = 1;
export const helloModelStoreSchema = createStoreSchema(
    {
        ...graphicsStoreSchema.components,
        // particle: TrueSchema,
        // rotationZ: F32Schema,
        // color: Vec4.schema,
        // planet: TrueSchema,
        // mass: F32Schema,
        // gravity: TrueSchema,
        foo: TrueSchema,
    },
    {
        ...graphicsStoreSchema.resources,
        // the map is a flat 2D plane
        mapSize: { default: [800, 600] as Vec2 },
    },
    {
        ...graphicsStoreSchema.archetypes,
        // CenterOfGravity: ["gravity", "position", "mass", "scale"],
        // Renderable: ["position", "velocity",  "rotationZ", "scale", "color"],
        // Particle: ["particle", "position", "velocity",  "rotationZ", "scale", "color", "mass"],
        Planet: ["foo", "position", "velocity"],
    }
);

export type HelloModelStore = StoreFromSchema<typeof helloModelStoreSchema>;

const checkThatHelloModelStoreIsGraphicsStore = (store: HelloModelStore): GraphicsStore => store;
