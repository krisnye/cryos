import { System } from "graphics/systems/system.js";
import { MainService } from "../main-service.js";
import * as VEC3 from "math/vec3/index.js";

export const moveParticlesSystem = ({ store }: MainService): System => {
    return {
        name: "moveParticlesSystem",
        phase: "update",
        run: () => {
            const timeScale = store.resources.timeScale;
            for (const table of store.queryArchetypes(["id", "velocity", "position_scale", "particle"])) {
                for (let i = table.rowCount - 1; i >= 0; i--) {
                    const velocity = table.columns.velocity.get(i);
                    if (velocity[0] === 0 && velocity[1] === 0 && velocity[2] === 0) {
                        store.update(table.columns.id.get(i), { velocity: undefined });
                        continue;
                    }
                    const [x, y, z, scale] = table.columns.position_scale.get(i);
                    const position: VEC3.Vec3 = [x, y, z];
                    const newPosition = VEC3.add(position, VEC3.scale(velocity, timeScale));
                    const maxRange = 10;
                    if (newPosition[0] < -maxRange || newPosition[0] > maxRange || newPosition[1] < -maxRange || newPosition[1] > maxRange || newPosition[2] < -maxRange || newPosition[2] > maxRange) {
                        table.columns.velocity.set(i, VEC3.negate(velocity))
                    }
                    table.columns.position_scale.set(i, [newPosition[0], newPosition[1], newPosition[2], scale]);
                }
            }
        }
    }
};
