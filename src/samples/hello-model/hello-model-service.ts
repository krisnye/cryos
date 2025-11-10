import { Store } from "@adobe/data/ecs";
import { Vec2 } from "@adobe/data/math";
import { GameService } from "game-service/game-service.js";
import * as helloModelTransactions from "./transactions/index.js";

// Store Schema
const schema = GameService.schema(
    {
    },
    {
        mapSize: { default: [800, 600] as Vec2 },
    },
    {
        // No custom archetypes - just using the graphics ones
    }
);

export type HelloModelStore = Store.FromSchema<typeof schema>;

export function createHelloModelService() {
    const service = GameService.create(
        schema,
        helloModelTransactions,
    ).initializeSystems({
        // no custom systems.
    });
    // Create some test data
    service.database.transactions.createTestModels();
    return service;
}

export type HelloModelService = ReturnType<typeof createHelloModelService>;


