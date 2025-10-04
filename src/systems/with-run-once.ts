import { System } from "./system.js";

/**
 * @returns A system that runs once.
 */
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