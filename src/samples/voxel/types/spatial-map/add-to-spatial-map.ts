import { Entity } from "@adobe/data/ecs";
import { SpatialMap } from "./spatial-map.js";
import { getSpatialMapColumn } from "./get-spatial-map-column.js";

export const addToSpatialMap = (spatialMap: SpatialMap, x: number, y: number, z: number, entity: Entity) => {
    const column = getSpatialMapColumn(spatialMap, x, y, true);
    const zIndex = Math.floor(z);
    const value = column[zIndex];
    if (!value) {
        column[zIndex] = entity;
    } else if (Array.isArray(value)) {
        value.push(entity);
    } else {
        column[zIndex] = [value, entity];
    }
}


