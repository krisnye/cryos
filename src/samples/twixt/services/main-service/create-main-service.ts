import { createTwixtStateService } from "../state-service/state-service.js";
import { MainService } from "./main-service.js";

export function createMainService(): MainService {
    return {
        serviceName: "twixt-main-service",
        state: createTwixtStateService(),
    };
}
