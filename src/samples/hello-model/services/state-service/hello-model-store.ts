import { createStoreSchema, StoreFromSchema } from "@adobe/data/ecs";
import { Vec2, Vec3, Vec4 } from "@adobe/data/math";
import { F32Schema, FromSchema, Schema, TrueSchema, U32Schema } from "@adobe/data/schema";
import { GraphicsStore, graphicsStoreSchema } from "graphics/database/index.js";
import { Frame } from "graphics/frame.js";

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
    },
    {
        ...graphicsStoreSchema.resources,
        // the map is a flat 2D plane
        // mapSize: { default: [800, 600] as Vec2 },
        // canvas: { default: null as HTMLCanvasElement | null },
        // updateFrame: { default: { count: 0, deltaTime: 1 / 60 } as Frame },
        // renderFrame: { default: { count: 0, deltaTime: 1 / 60 } as Frame },
    },
    {
        ...graphicsStoreSchema.archetypes,
        // CenterOfGravity: ["gravity", "position", "mass", "scale"],
        // Renderable: ["position", "velocity",  "rotationZ", "scale", "color"],
        // Particle: ["particle", "position", "velocity",  "rotationZ", "scale", "color", "mass"],
        // Planet: ["planet", "position", "velocity", "rotationZ", "scale", "color", "mass", "gravity"],
    }
);

export type HelloModelStore = StoreFromSchema<typeof helloModelStoreSchema>;

const checkThatHelloModelStoreIsGraphicsStore = (store: HelloModelStore): GraphicsStore => store;
