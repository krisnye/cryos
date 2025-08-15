import { GraphicsContext } from "../../../graphics/index.js";
import { createSystemService } from "graphics/systems/create-system-service.js";
import { applyArg } from "@adobe/data/functions";
import * as systemFactories from "./systems/index.js";
import { createParticlesStore } from "./particles-store.js";
import { createParticleDatabase } from "./particle-database.js";

export async function createMainService(context: GraphicsContext) {
    const store = createParticlesStore(context);
    const database = createParticleDatabase(store, context);

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
