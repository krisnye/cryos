import { MaterialCollisionInput } from "./material-collision-input.js";
import { MaterialCollisionResult } from "./material-collision-result.js";

/**
 * Pure collision solver contract for material-vs-material impacts.
 */
export type MaterialCollision = (
    input: MaterialCollisionInput
) => MaterialCollisionResult;

export * as MaterialCollision from "./public.js";
