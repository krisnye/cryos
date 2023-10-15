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

    // Taken from: https://github.com/toji/gl-matrix/blob/2534c9d0dd8c947ec7ddd4223d99447de017bac9/src/quat.js#L416
    // See https://www.cs.cmu.edu/~kiranb/animation/p245-shoemake.pdf#page=9
    static fromMatrix4(m: Matrix4) {

        let a = Array.from(m)
        let trace = a[0] + a[5] + a[10]

        if (trace > 0.0) {
            let root = Math.sqrt(trace + 1) // = 2 Q.w
            let w = .5 * root
            root = .5 / root // = 1 / (4 Q.w)
            return new Quaternion(
                (a[6] - a[9]) * root,
                (a[8] - a[2]) * root,
                (a[1] - a[4]) * root,
                w
            )
        } else {
            let out: [number, number, number, number] = [0, 0, 0, 0]

            // Pick largest component of quaternion to solve for, Q[i].
            let i = 0
            if (a[5] > a[0]) i = 1
            if (a[10] > a[i * 4 + i]) i = 2
            let j = (i + 1) % 3
            let k = (i + 2) % 3

            let root = Math.sqrt(a[i * 4 + i] - a[j * 4 + j] - a[k * 4 + k] + 1) // = 2 Q[i]

            out[i] = .5 * root
            root = .5 / root // = 1 / (4 Q[i])
            out[3] = (a[j * 4 + k] - a[k * 4 + j]) * root // = 4 Q[i] Q.w * root
            out[j] = (a[j * 4 + i] + a[i * 4 + j]) * root // = 4 Q[i] Q[j] * root
            out[k] = (a[k * 4 + i] + a[i * 4 + k]) * root // = 4 Q[i] Q[k] * root

            return new Quaternion(...out)
        }
    }

}
