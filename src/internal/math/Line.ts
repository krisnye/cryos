import { Vector3 } from "./Vector3.js"
import { Supported } from "./Supported.js"

/**
 * Represents a line and/or a line segment.
 * The normalized position along the line corresponds to 
 * When representing a line segment then any positions between 'a' and 'b' inclusive
 * are consider on the line segment and can be represented with normalized values
 * between zero and one.
 */
export class Line implements Supported {

    a: Vector3
    b: Vector3

    constructor(a: Vector3, b: Vector3) {
        this.a = a
        this.b = b
    }

    /**
     * Returns the position between a and b where 0 = a and 1 = b.
     * @param alpha value normally between 0 and 1
     */
    getPosition(alpha: number) {
        return this.a.lerp(this.b, alpha)
    }

    /**
     * Returns the alpha value (normalized position along the line)
     * that corresponds to the closest point on this line to the position.
     * @param position 
     */
    getAlpha(position: Vector3) {
        let ab = this.b.subtract(this.a)
        let ap = position.subtract(this.a)
        return ab.dot(ap) / ab.lengthSquared()
    }

    support(v: Vector3) {
        return v.dot(this.a) > v.dot(this.b) ?
            this.a :
            this.b
    }

    toString() {
        return `${this.a} -> ${this.b}`
    }

}