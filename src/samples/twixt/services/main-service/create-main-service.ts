import { createStateService } from "../state-service/create-state-service";
import { MainService } from "./main-service";

export function createMainService(): MainService {
    return {
        state: createStateService(),
    } as unknown as MainService;
}
