import { Service } from "@adobe/data/service";
import { getWebGPUDevice } from "graphics/get-web-gpu-device.js";
import { createHelloModelDatabase, HelloModelDatabase } from "../state-service/hello-model-database.js";
import { HelloModelStore, helloModelStoreSchema } from "../state-service/hello-model-store.js";
import { createStoreFromSchema } from "@adobe/data/ecs";
import { SystemSchedulerService } from "systems/system-scheduler-service.js";
import { createSystemSchedulerService } from "systems/create-scheduler-service.js";
import * as systemFactories from "../../systems/index.js";

export interface MainService extends Service {
    store: HelloModelStore;
    database: HelloModelDatabase;
    scheduler: SystemSchedulerService;
}

export function createHelloModelMainService(): MainService {
    const store = createStoreFromSchema(helloModelStoreSchema);

    const database = createHelloModelDatabase(store);

    // creating some test data
    database.transactions.createTestModels();

    getWebGPUDevice().then(device => {
        database.transactions.setDevice(device);
    })
    const scheduler = createSystemSchedulerService(store);

    const mainService: MainService = {
        serviceName: "hello-model-main-service",
        store,
        database,
        scheduler,
    };

    scheduler.addSystems(Object.values(systemFactories).map(factory => factory(mainService)).flat());
    scheduler.setRunning(true);

    return mainService;
}
