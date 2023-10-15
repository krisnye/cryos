import { Matrix4 } from "./Matrix4.js"
import { Vector3 } from "./Vector3.js"
import { hypot3, hypot4 } from "./functions.js"

export class Quaternion {

    readonly x: number
    readonly y: number
    readonly z: number
    readonly w: number

    constructor(x: number, y: number, z: number, w: number) {
        this.x = x
        this.y = y
        this.z = z
        this.w = w
    }

    *[Symbol.iterator]() {
        yield this.x
        yield this.y
        yield this.z
        yield this.w
    }

    length() {
        return hypot4(this.x, this.y, this.z, this.w)
    }

    normalize() {
        let invLength = 1 / this.length()
        return new Quaternion(this.x * invLength, this.y * invLength, this.z * invLength, this.w * invLength)
    }

    inverse() {
        return new Quaternion(-this.x, -this.y, -this.z, this.w)
    }

    axis() {
        return new Vector3(
            this.x,
            this.y,
            this.z
        )
    }

    angle() {
        return Math.atan2(hypot3(this.x, this.y, this.z), this.w) * 2
    }

    /*
        Times table:
        L\R  x  y  z    w
          +--------------
        x | -w  z -y    x
        y | -z -w  x    y
        z |  y -x -w    z
          |
        w |  x  y  z    w
    */
    multiply(R: Quaternion) {
        let L = this

        let x
            = L.x * R.w + L.w * R.x
            + L.y * R.z - L.z * R.y
        let y
            = L.y * R.w + L.w * R.y
            + L.z * R.x - L.x * R.z
        let z
            = L.z * R.w + L.w * R.z
            + L.x * R.y - L.y * R.x
        let w
            = L.w * R.w
            - L.x * R.x - L.y * R.y - L.z * R.z

        return new Quaternion(x, y, z, w)
    }

    rotateVector(v: Vector3) {
        return this.multiply(new Quaternion(v.x, v.y, v.z, 0)).multiply(this.inverse()).axis()
    }

    static readonly identity = new Quaternion(0, 0, 0, 1)

    static fromAxisAngle(axis: Vector3, angle: number) {
        let { x, y, z } = axis
        let theta = angle / 2
        let scale = Math.sin(theta) / hypot3(x, y, z)
        return new Quaternion(
            x * scale,
            y * scale,
            z * scale,
            Math.cos(theta),
        )
    }

    static fromMatrix(m: Matrix4) {
        throw new Error("Not correctly implemented")
    }

    // Generated using: https://gist.github.com/KodyJKing/1042645c24c212017867a9495a76aca6
    toMatrix4() {
        let q = this
        return new Matrix4(
            q.w ** 2 + q.x ** 2 - q.y ** 2 - q.z ** 2, 2 * q.w * q.z + 2 * q.x * q.y, -2 * q.w * q.y + 2 * q.x * q.z, 0,
            -2 * q.w * q.z + 2 * q.x * q.y, q.w ** 2 - q.x ** 2 + q.y ** 2 - q.z ** 2, 2 * q.w * q.x + 2 * q.y * q.z, 0,
            2 * q.w * q.y + 2 * q.x * q.z, -2 * q.w * q.x + 2 * q.y * q.z, q.w ** 2 - q.x ** 2 - q.y ** 2 + q.z ** 2, 0,
            0, 0, 0, 1
        )
    }

}
