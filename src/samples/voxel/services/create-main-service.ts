import { createDatabase, createStore } from "@adobe/data/ecs";
import { GraphicsContext } from "../../../graphics/index.js";
import { createVoxelDatabaseSchema } from "./voxel-database.js";
import { createSystemService } from "graphics/systems/create-system-service.js";
import { applyArg } from "@adobe/data/functions";
import * as systemFactories from "./systems/index.js";

export async function createMainService(context: GraphicsContext) {

    const schema = createVoxelDatabaseSchema(context);
    const store = createStore(schema.components, schema.resources, schema.archetypes);
    const database = createDatabase(store, schema.transactions);

    const systemRunner = createSystemService(store);
    systemRunner.setRunning(true);
    systemRunner.updateFrame(database.transactions.setUpdateFrame);
    systemRunner.renderFrame(database.transactions.setRenderFrame);

    const service = {
        serviceName: "particles-main-service",
        database,
        store,
        systemRunner,
    };
    const systems = applyArg(service, systemFactories);
    systemRunner.addSystems(Object.values(systems).flat());

    return service;
}

export type MainService = Awaited<ReturnType<typeof createMainService>>;
export type MainDatabase = MainService["database"];
export type MainStore = MainService["store"];
