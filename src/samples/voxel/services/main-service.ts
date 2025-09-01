import { GraphicsContext } from "../../../graphics/index.js";
import { createSystemService } from "graphics/systems/create-system-service.js";
import { applyArg } from "@adobe/data/functions";
import * as systemFactories from "./systems/index.js";
import { createVoxelStore } from "./voxel-store.js";
import { createVoxelDatabase } from "./voxel-database.js";
import { createUndoRedoService } from "@adobe/data/ecs";

export async function createMainService(context: GraphicsContext) {
    const store = createVoxelStore(context);
    const database = createVoxelDatabase(store, context);

    const systemRunner = createSystemService(store);
    systemRunner.setRunning(true);
    systemRunner.updateFrame(database.transactions.setUpdateFrame);
    systemRunner.renderFrame(database.transactions.setRenderFrame);

    const undoRedo = createUndoRedoService(database);

    const service = {
        serviceName: "particles-main-service",
        database,
        store,
        systemRunner,
        undoRedo,
    };
    const systems = applyArg(service, systemFactories);
    systemRunner.addSystems(Object.values(systems).flat());

    return service;
}

export type MainService = Awaited<ReturnType<typeof createMainService>>;
