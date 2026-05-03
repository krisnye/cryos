import { Vec3 } from "@adobe/data/math";
import { MaterialCollisionBody } from "./material-collision-body.js";

/**
 * Complete collision context for a single impact solve.
 * All fields are required so the solver contract stays explicit.
 */
export interface MaterialCollisionInput {
    a: MaterialCollisionBody;
    b: MaterialCollisionBody;
    contactNormal: Vec3;
    contactAreaM2: number;
    timeStepSeconds: number;
}
