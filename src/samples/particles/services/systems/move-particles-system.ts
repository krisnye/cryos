import { System } from "graphics/systems/system.js";
import { MainService } from "../create-main-service.js";
import * as VEC3 from "math/vec3/index.js";

export const moveParticlesSystem = ({ store }: MainService): System => {
    const particleTable = store.ensureArchetype(["id", "velocity", "particle"]);
    return {
        name: "moveParticlesSystem",
        phase: "update",
        run: () => {
            for (let i = 0; i < particleTable.rows; i++) {
                const particle = particleTable.columns.particle.get(i);
                const velocity = particleTable.columns.velocity.get(i);
                const position = particle.position;
                const newPosition = VEC3.add(position, velocity);
                const maxRange = 10;
                if (newPosition[0] < -maxRange || newPosition[0] > maxRange || newPosition[1] < -maxRange || newPosition[1] > maxRange || newPosition[2] < -maxRange || newPosition[2] > maxRange) {
                    particleTable.columns.velocity.set(i, VEC3.negate(velocity))
                }
                particleTable.columns.particle.set(i, {
                    ...particle,
                    position: newPosition
                });
            }
        }
    }
};
