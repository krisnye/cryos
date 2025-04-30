import { createStateService } from "../state-service/create-state-service";

export function createMainService() {
    return {
        state: createStateService()
    }
}
