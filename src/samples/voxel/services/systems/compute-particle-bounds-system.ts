import { System } from "graphics/systems/system.js";
import { MainService } from "../main-service.js";
import * as VEC3 from "math/vec3/index.js";

export const computeParticleBoundsSystem = ({ store }: MainService): System => {
    return {
        name: "computeParticleBoundsSystem",
        phase: "postUpdate",
        run: () => {
            for (const table of store.queryArchetypes(["id", "particle", "position_scale", "boundingBox"])) {
                for (let row = 0; row < table.rowCount; row++) {
                    const [x, y, z, scale] = table.columns.position_scale.get(row);
                    const position: VEC3.Vec3 = [x, y, z];
                    table.columns.boundingBox.set(row, {
                        min: VEC3.subtract(position, [0.5 * scale, 0.5 * scale, 0.5 * scale]),
                        max: VEC3.add(position, [0.5 * scale, 0.5 * scale, 0.5 * scale])
                    });
                }
            }
        }
    }
};
