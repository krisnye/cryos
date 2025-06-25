import { System } from "./system.js";

export const withRunOnce = (system: System) => {
    let hasRun = false;
    return {
        ...system,
        run: () => {
            if (!hasRun) {
                hasRun = true;
                system.run();
            }
        }
    }
}