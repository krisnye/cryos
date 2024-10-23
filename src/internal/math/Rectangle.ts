import { Size } from "./Size.js"
import { Vector2 } from "./Vector2.js"
import { Vector3 } from "./Vector3.js"
import { Vector4 } from "./Vector4.js"
import { Spacing } from "./Spacing.js"
import { BoundingShape } from "./BoundingShape.js"
import { Line } from "./Line.js"
import { Capsule } from "./Capsule.js"
import { Plane } from "./Plane.js"
import { clamp } from "./functions.js"
import { epsilon } from "./constants.js"

export class Rectangle implements Size, BoundingShape {

    readonly x: number
    readonly y: number
    readonly width: number
    readonly height: number

    constructor(x: number, y: number, width: number, height: number) {
        this.x = x
        this.y = y
        this.width = width
        this.height = height
    }

    get top() { return this.y }
    get left() { return this.x }
    get bottom() { return this.y + this.height }
    get right() { return this.x + this.width }
    get topLeft() { return new Vector2(this.x, this.y) }
    get bottomRight() { return new Vector2(this.right, this.bottom) }
    get topRight() { return new Vector2(this.right, this.bottom) }
    get bottomLeft() { return new Vector2(this.left, this.bottom) }

    contains(x: number, y: number) {
        return x >= this.left && x <= this.right
            && y >= this.top && y <= this.bottom
    }

    containsPoint(point: Vector2 | Vector3 | Vector4) {
        return this.contains(point.x, point.y)
    }

    add(b: Spacing) {
        if (!b || b.isZero) {
            return this
        }
        return new Rectangle(this.x - b.left, this.y - b.top, this.width + b.left + b.right, this.height + b.top + b.bottom)
    }

    subtract(b: Spacing) {
        if (!b || b.isZero) {
            return this
        }
        return new Rectangle(this.x + b.left, this.y + b.top, this.width - b.left - b.right, this.height - b.top - b.bottom)
    }

    intersectsCapsule(capsule: Capsule): Vector3 | null {
        //  TODO: Fix this shit
        let line = capsule.line()
        let pointInRect = this.getClosestPoint(line)
        let alpha = line.getAlpha(pointInRect)
        let radius = capsule.getRadius(alpha)
        let pointInLine = line.getPosition(alpha)
        return pointInRect.subtract(pointInLine).length() <= (radius + epsilon) ? pointInRect : null
        // let dx = Math.min(Math.abs(pointInRect.x - this.left), Math.abs(pointInRect.x - this.right))
        // let dy = Math.min(Math.abs(pointInRect.y - this.top), Math.abs(pointInRect.y - this.bottom))
        // return (radius * radius) <= (dx * dx + dy * dy) ? pointInRect : null
    }

    intersectsLine(line: Line): boolean {
        let point = this.getPlane().getClosestPoint(line)
        return this.containsPoint(point)
    }

    /**
     * Returns the closest point to the line which lies within this bounding shape.
     * If multiple points intersect the line the point closest to 'a' is preferred.
     */
    getClosestPoint(line: Line): Vector3 {
        let point = this.getPlane().getClosestPoint(line)
        if (this.containsPoint(point)) {
            return point
        }
        let x = clamp(point.x, this.left, this.right)
        let y = clamp(point.y, this.top, this.bottom)
        return new Vector3(x, y, 0)
    }

    /**
     * Returns the plane this Rectangle lies on.
     * The plane intersects the origin and the normal is in the positive z direction.
     */
    getPlane() {
        return new Plane(new Vector3(0, 0, 1), 0)
    }

    combine(b: Rectangle) {
        if (b === this || this.containsRectangle(b)) {
            return this
        }
        if (b.containsRectangle(this)) {
            return b
        }
        let left = Math.min(this.left, b.left)
        let right = Math.max(this.right, b.right)
        let top = Math.min(this.top, b.top)
        let bottom = Math.max(this.bottom, b.bottom)
        return new Rectangle(left, top, right - left, bottom - top)
    }

    containsRectangle(b: Rectangle) {
        return this.contains(b.left, b.top) && this.contains(b.right, b.bottom)
    }

    static empty = Object.freeze(new Rectangle(0, 0, 0, 0))

    static getBounds(rectangles: Rectangle[]) {
        if (rectangles.length === 0) {
            return Rectangle.empty
        }
        let result = rectangles[0]
        for (let i = 1; i < rectangles.length; i++) {
            result = result.combine(rectangles[i])
        }
        return result
    }

}
