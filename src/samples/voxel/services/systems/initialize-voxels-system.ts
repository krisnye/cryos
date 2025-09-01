import { System } from "graphics/systems/system.js";
import { MainService } from "../main-service.js";
import { withRunOnce } from "graphics/systems/with-run-once.js";

export const initializeParticlesSystem = (main: MainService): System => {
    const { store, database } = main;
    return withRunOnce({
        name: "initializeParticlesSystem",
        phase: "update",
        run: () => {
            // Add random particles (configurable count)
            database.transactions.addRandomParticles({ count: 10 });
            
            // Add axis reference particles
            database.transactions.addAxisParticles();
            
            // Add walls extending from origin
            database.transactions.addWalls({ length: 16 });
        }
    })
};
