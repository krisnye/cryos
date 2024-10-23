import { Capsule } from "./Capsule.js"
import { Line } from "./Line.js"
import { Vector3 } from "./Vector3.js"

export interface BoundingShape {

    /**
     *  returns something truthy if this bounding shape intersects this capsule at all
     */
    intersectsCapsule(capsule: Capsule): any
    /**
     * Returns the closest point to the line which lies within this bounding shape.
     */
    getClosestPoint(line: Line): Vector3


}