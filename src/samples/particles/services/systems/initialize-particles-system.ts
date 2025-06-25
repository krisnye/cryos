import { MainService } from "../create-main-service.js";
import { withRunOnce } from "graphics/systems/with-run-once.js";

export const initializeParticlesSystem = ({ store }: MainService) => {
    const particleTable = store.ensureArchetype(["id", "position", "velocity", "particle"]);
    return withRunOnce({
        phase: "update",
        run: () => {
            // add 100 random particles positioned from -1 to +1
            // and with random velocity from -0.1 to +0.1
            for (let i = 0; i < 100; i++) {
                particleTable.insert({
                    position: [Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1],
                    velocity: [Math.random() * 0.2 - 0.1, Math.random() * 0.2 - 0.1, Math.random() * 0.2 - 0.1],
                    particle: true
                })
            }

            console.log(particleTable);
        }
    })
};
