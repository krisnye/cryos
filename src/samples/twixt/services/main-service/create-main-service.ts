import { createTwixtStateService } from "../state-service/create-state-service2";
import { MainService } from "./main-service";

export function createMainService(): MainService {
    return {
        state: createTwixtStateService(),
    } as unknown as MainService;
}
