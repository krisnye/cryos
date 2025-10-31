import { createStoreSchema, StoreFromSchema } from "@adobe/data/ecs";
import { Vec2 } from "@adobe/data/math";
import { TrueSchema } from "@adobe/data/schema";
import { GraphicsStore, graphicsStoreSchema } from "../../graphics/database/index.js";
import { Assert } from "@adobe/data/types";

// Store Schema
export const forestStoreSchemaVersion = 1;
export const forestStoreSchema = createStoreSchema(
    {
        ...graphicsStoreSchema.components,
        tree: TrueSchema,
    },
    {
        ...graphicsStoreSchema.resources,
        mapSize: { default: [800, 600] as Vec2 },
    },
    {
        ...graphicsStoreSchema.archetypes,
        Tree: ["tree", "position", "velocity"],
    }
);

export type ForestStore = StoreFromSchema<typeof forestStoreSchema>;

export type Particle = Parameters<ForestStore["archetypes"]["Particle"]["insert"]>[0];

type _AssertForestStoreIsGraphicsStore = Assert<ForestStore extends GraphicsStore ? true : false>;
