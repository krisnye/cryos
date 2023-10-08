import { Vector3 } from "./Vector3.js"
import { Matrix4 } from "./Matrix4.js"
import { Supported } from "./Supported.js"
import { Ray } from "./Ray.js"

export class Sphere implements Supported {

    readonly center: Vector3
    readonly radius: number

    constructor(center: Vector3 = Vector3.zero, radius = 1) {
        this.center = center
        this.radius = radius
    }

    translate(v: Vector3) {
        return new Sphere(
            this.center.translate(v),
            this.radius
        )
    }

    transform(m: Matrix4) {
        // to transform the radius we will transform two points radius distance apart and then use their new distance
        let center = this.center.transform(m)
        let surface = new Vector3(this.center.x, this.center.y, this.center.z + this.radius).transform(m)
        return new Sphere(center, center.subtract(surface).length())
    }

    // Returns the furthest point along a direction.
    support(v: Vector3) {
        return v.normalize().scale(this.radius).add(this.center)
    }

    addRadius(value: number) {
        return value === 0 ? this : new Sphere(this.center, this.radius + value)
    }

    raycastDistance(ray: Ray, front: boolean = true) {
        let toSphere = this.center.subtract(ray.point)
        let parallelDist = toSphere.dot(ray.unitHeading)
        if (parallelDist < 0)
            return null
        let perpendicular = ray.unitHeading.rejection(toSphere)
        let perpendicularDistSq = perpendicular.lengthSquared()
        let radiusSq = this.radius ** 2
        if (perpendicularDistSq > radiusSq)
            return null
        let radiusOfSlice = Math.sqrt(radiusSq - perpendicularDistSq)
        return front ?
            parallelDist - radiusOfSlice :
            parallelDist + radiusOfSlice
    }

    raycast(ray: Ray, front: boolean = true) {
        let distance = this.raycastDistance(ray, front)
        if (distance === null)
            return null
        return ray.getPosition(distance)
    }


}