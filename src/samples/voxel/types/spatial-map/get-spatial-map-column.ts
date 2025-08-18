import { Vec2, Vec3, Vec4 } from "math/index.js";
import { getSpatialMapKey } from "./get-spatial-map-key.js";
import { SpatialMap } from "./spatial-map.js";

export function getSpatialMapColumn(spatialMap: SpatialMap, position: Vec2 | Vec3 | Vec4): Array<undefined | number | number[]> | null
export function getSpatialMapColumn(spatialMap: SpatialMap, position: Vec2 | Vec3 | Vec4, create: true): Array<undefined | number | number[]>
export function getSpatialMapColumn(spatialMap: SpatialMap, position: Vec2 | Vec3 | Vec4, create = false): Array<undefined | number | number[]> | null {
    const index = getSpatialMapKey(position);
    let columns = spatialMap.get(index);
    if (!columns && create) {
        columns = [];
        spatialMap.set(index, columns);
    }
    return columns ?? null;
}
