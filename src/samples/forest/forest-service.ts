import { Store } from "@adobe/data/ecs";
import { Vec2 } from "@adobe/data/math";
import { TrueSchema } from "@adobe/data/schema";
import { GameService } from "game-service/game-service.js";
import * as forestTransactions from "./transactions/index.js";

// Store Schema
const schema = GameService.schema(
    {
        tree: TrueSchema,
    },
    {
        mapSize: { default: [800, 600] as Vec2 },
    },
    {
        Tree: ["tree", "position", "velocity"],
    }
);

export type ForestStore = Store.FromSchema<typeof schema>;
export type Particle = Store.InsertValues<ForestStore, "Particle">;

export function createForestService() {
    const service = GameService.create(
        schema,
        forestTransactions,
    )
    service.initializeSystems({
        // no custom systems.
    });
    // Create some test data
    service.database.transactions.createTestModels();
    return service;
};

export type ForestService = ReturnType<typeof createForestService>;
