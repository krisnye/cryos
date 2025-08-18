import { Entity } from "@adobe/data/ecs";
import { Vec3, Vec4 } from "math/index.js";
import { getSpatialMapColumn } from "./get-spatial-map-column.js";
import { SpatialMap } from "./spatial-map.js";

export const removeFromSpatialMap = (spatialMap: SpatialMap, position: Vec3 | Vec4, entity: Entity) => {
    const column = getSpatialMapColumn(spatialMap, position, true);
    const zIndex = Math.floor(position[2]);
    const value = column[zIndex];
    if (!value) {
        column[zIndex] = undefined;
    } else if (Array.isArray(value)) {
        const index = value.indexOf(entity);
        if (index !== -1) {
            value.splice(index, 1);
            if (value.length === 1) {
                column[zIndex] = value[0];
            }
        }
    }
};
