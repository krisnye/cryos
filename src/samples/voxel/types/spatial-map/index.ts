// Core types
export type { SpatialMap } from "./spatial-map.js";

// Spatial lookup functions
export { getFromSpatialMap } from "./get-from-spatial-map.js";
export { getSpatialMapKey } from "./get-spatial-map-key.js";
export { getSpatialMapColumn } from "./get-spatial-map-column.js";

// Entity management functions
export { addToSpatialMap } from "./add-to-spatial-map.js";
export { removeFromSpatialMap } from "./remove-from-spatial-map.js";

// Picking function
export { pickFromSpatialMap } from "./pick-from-spatial-map.js";
export type { PickResult } from "./pick-from-spatial-map.js"; 