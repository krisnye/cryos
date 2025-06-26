import { createTwixtStateService } from "../state-service/state-service.js";
import { MainService } from "./main-service.js";

export function createMainService(): MainService {
    return {
        state: createTwixtStateService(),
    } as unknown as MainService;
}
