import { Vector3 } from "./Vector3.js"
import { BoundingShape } from "./BoundingShape.js"
import { Capsule } from "./Capsule.js"
import { Line } from "./Line.js"
import { equivalent } from "./functions.js"
import { Supported } from "./Supported.js"

/**
 * A Plane is represented by a normal vector
 * and a distance from the origin to the closest point on the plane.
 */
export class Plane implements BoundingShape {

    normal: Vector3
    distance: number

    constructor(normal: Vector3, distance: number) {
        this.normal = normal
        this.distance = distance
    }

    getClosestPointToOrigin() {
        return new Vector3(
            this.normal.x * this.distance,
            this.normal.y * this.distance,
            this.normal.z * this.distance,
        )
    }

    intersects(shape: Supported): boolean {
        let point = this.getClosestPointToOrigin()
        let max = shape.support(this.normal)
        let min = shape.support(this.normal.negate())
        let pMax = max.subtract(point)
        let pMin = min.subtract(point)
        let maxDist = this.normal.dot(pMax)
        let minDist = this.normal.dot(pMin)
        return Math.sign(maxDist) != Math.sign(minDist)
    }

    intersectsCapsule(capsule: Capsule) {
        return this.intersects(capsule)
    }

    getClosestPoint(line: Line): Vector3 {
        let point = this.getClosestPointToOrigin()
        let ap = point.subtract(line.a)
        let distance = ap.dot(this.normal)
        if (equivalent(distance, 0))
            return line.a

        let heading = line.b.subtract(line.a)
        let speed = heading.dot(this.normal)
        if (equivalent(speed, 0))
            return line.a.subtract(this.normal.projection(line.a))

        let dt = distance / speed
        return line.getPosition(dt)
    }

}