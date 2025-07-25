import { System } from "graphics/systems/system.js";
import { MainService } from "../create-main-service.js";
import * as VEC3 from "math/vec3/index.js";

export const moveParticlesSystem = ({ store }: MainService): System => {
    return {
        name: "moveParticlesSystem",
        phase: "update",
        run: () => {
            const timeScale = store.resources.timeScale;
            for (const table of store.queryArchetypes(["id", "velocity", "particle"])) {
                for (let i = 0; i < table.rowCount; i++) {
                    const particle = table.columns.particle.get(i);
                    const velocity = table.columns.velocity.get(i);
                    const position = particle.position;
                    const newPosition = VEC3.add(position, VEC3.scale(velocity, timeScale));
                    const maxRange = 10;
                    if (newPosition[0] < -maxRange || newPosition[0] > maxRange || newPosition[1] < -maxRange || newPosition[1] > maxRange || newPosition[2] < -maxRange || newPosition[2] > maxRange) {
                        table.columns.velocity.set(i, VEC3.negate(velocity))
                    }
                    table.columns.particle.set(i, {
                        ...particle,
                        position: newPosition
                    });
                }
            }
        }
    }
};
