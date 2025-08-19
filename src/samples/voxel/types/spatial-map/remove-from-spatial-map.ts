import { Entity } from "@adobe/data/ecs";
import { getSpatialMapColumn } from "./get-spatial-map-column.js";
import { SpatialMap } from "./spatial-map.js";

export const removeFromSpatialMap = (spatialMap: SpatialMap, x: number, y: number, z: number, entity: Entity) => {
    const column = getSpatialMapColumn(spatialMap, x, y, true);
    const zIndex = Math.floor(z);
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
