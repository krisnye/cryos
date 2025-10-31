import { Service } from "@adobe/data/service";
import { createDatabase, createStoreFromSchema } from "@adobe/data/ecs";
import { getWebGPUDevice } from "../../graphics/get-web-gpu-device.js";
import { createSystemSchedulerService } from "../../systems/create-scheduler-service.js";
import { SystemSchedulerService } from "../../systems/system-scheduler-service.js";
import * as graphicsTransactions from "../../graphics/database/transactions/index.js";
import * as graphicsSystems from "../../graphics/systems/index.js";
import * as uiSystems from "../../ui/systems/index.js";
import { forestStoreSchema, ForestStore } from "./forest-store.js";
import * as forestTransactions from "./transactions/index.js";

// Database
const createForestDatabase = (store: ForestStore) => {
    return createDatabase(store, {
        ...graphicsTransactions,
        ...forestTransactions,
    });
};

type ForestDatabase = ReturnType<typeof createForestDatabase>;

// Service
export interface ForestService extends Service {
    store: ForestStore;
    database: ForestDatabase;
    scheduler: SystemSchedulerService;
}

export const createForestService = (): ForestService => {
    const store = createStoreFromSchema(forestStoreSchema);
    const database = createForestDatabase(store);
    
    // Create some test data
    database.transactions.createTestModels();
    
    getWebGPUDevice().then(device => {
        database.transactions.setDevice(device);
    });
    
    const scheduler = createSystemSchedulerService(store);
    
    const service: ForestService = {
        serviceName: "forest-service",
        store,
        database,
        scheduler,
    };
    
    // Add all graphics and UI systems
    const systemFactories = { ...graphicsSystems, ...uiSystems };
    scheduler.addSystems(Object.values(systemFactories).map(factory => factory(service)).flat());
    scheduler.setRunning(true);
    
    return service;
};

