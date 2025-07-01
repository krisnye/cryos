import { System } from "graphics/systems/system.js";
import { MainService } from "../create-main-service.js";
import * as VEC3 from "math/vec3/index.js";

export const computeParticleBoundsSystem = ({ store }: MainService): System => {
    return {
        name: "computeParticleBoundsSystem",
        phase: "postUpdate",
        run: () => {
            for (const table of store.queryArchetypes(["id", "particle", "position", "boundingBox"])) {
                for (let row = 0; row < table.rows; row++) {
                    const position = table.columns.position.get(row);
                    table.columns.boundingBox.set(row, {
                        min: VEC3.subtract(position, [0.5, 0.5, 0.5]),
                        max: VEC3.add(position, [0.5, 0.5, 0.5])
                    });
                }
            }
        }
    }
};
