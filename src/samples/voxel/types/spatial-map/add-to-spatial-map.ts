import { Entity } from "@adobe/data/ecs";
import { Vec3, Vec4 } from "math/index.js";
import { SpatialMap } from "./spatial-map.js";
import { getSpatialMapColumn } from "./get-spatial-map-column.js";

export const addToSpatialMap = (spatialMap: SpatialMap, position: Vec3 | Vec4, entity: Entity) => {
    const column = getSpatialMapColumn(spatialMap, position, true);
    const zIndex = Math.floor(position[2]);
    const value = column[zIndex];
    if (!value) {
        column[zIndex] = entity;
    } else if (Array.isArray(value)) {
        value.push(entity);
    } else {
        column[zIndex] = [value, entity];
    }
}


