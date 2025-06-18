import { createTwixtStateService } from "../state-service/state-service";
import { MainService } from "./main-service";

export function createMainService(): MainService {
    return {
        state: createTwixtStateService(),
    } as unknown as MainService;
}
