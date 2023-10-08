import { Line } from "./Line.js"
import { Sphere } from "./Sphere.js"
import { Matrix4 } from "./Matrix4.js"
import { Vector3 } from "./Vector3.js"
import { Supported } from "./Supported.js"

/**
 * Represents a swept sphere with potentially different radius at the starting and ending points.
 */
export class Capsule implements Supported {

    readonly a: Sphere
    readonly b: Sphere

    constructor(a: Sphere, b: Sphere) {
        this.a = a
        this.b = b
    }

    line() {
        return new Line(this.a.center, this.b.center)
    }

    /**
     * Gets the radius at a normalized position along the capsule.
     * @param alpha 
     */
    getRadius(alpha = 0.5) {
        return this.a.radius * (1 - alpha) + this.b.radius * alpha
    }

    addRadius(value: number) {
        return value === 0 ? this : new Capsule(this.a.addRadius(value), this.b.addRadius(value))
    }

    translate(v: Vector3) {
        return new Capsule(
            this.a.translate(v),
            this.b.translate(v)
        )
    }

    transform(m: Matrix4) {
        return new Capsule(
            this.a.transform(m),
            this.b.transform(m)
        )
    }

    // Returns the furthest point along a direction.
    support(v: Vector3) {
        let supportA = this.a.support(v)
        let supportB = this.b.support(v)
        return supportA.dot(v) > supportB.dot(v) ?
            supportA :
            supportB
    }

}