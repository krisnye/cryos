import { getSpatialMapKey } from "./get-spatial-map-key.js";
import { SpatialMap } from "./spatial-map.js";

export function getSpatialMapColumn(spatialMap: SpatialMap, x: number, y: number): Array<undefined | number | number[]> | null
export function getSpatialMapColumn(spatialMap: SpatialMap, x: number, y: number, create: true): Array<undefined | number | number[]>
export function getSpatialMapColumn(spatialMap: SpatialMap, x: number, y: number, create = false): Array<undefined | number | number[]> | null {
    const index = getSpatialMapKey(x, y);
    let columns = spatialMap.get(index);
    if (!columns && create) {
        columns = [];
        spatialMap.set(index, columns);
    }
    return columns ?? null;
}
