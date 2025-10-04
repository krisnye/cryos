
import { createDatabase } from "@adobe/data/ecs";
import { HelloModelStore } from "./hello-model-store.js";
import * as helloModelTransactions from "./transactions/index.js";
import { GraphicsDatabase, graphicsTransactions } from "graphics/database/index.js";

export function createHelloModelDatabase(store: HelloModelStore) {
    return createDatabase(store, {
        ...graphicsTransactions,
        ...helloModelTransactions,
    });
}

export type HelloModelDatabase = ReturnType<typeof createHelloModelDatabase>;

const checkHelloModelDatabaseIsGraphicsDatabase = (database: HelloModelDatabase): GraphicsDatabase => database;

