import { Matrix4 } from "./Matrix4.js"
import { equivalent } from "./functions.js"
import { Vector3 } from "./Vector3.js"
import { Color } from "./Color.js"

export class Vector4 {

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

    add(v: Vector4) {
        return new Vector4(this.x + v.x, this.y + v.y, this.z + v.z, this.w + v.w)
    }

    subtract(v: Vector4) {
        return new Vector4(this.x - v.x, this.y - v.y, this.z - v.z, this.w - v.w)
    }

    multiply(v: Vector4) {
        return new Vector4(this.x * v.x, this.y * v.y, this.z * v.z, this.w * v.w)
    }

    scale(f: number) {
        return new Vector4(this.x * f, this.y * f, this.z * f, this.w * f)
    }

    negate() {
        return new Vector4(- this.x, - this.y, - this.z, - this.w)
    }

    equals(v: Vector4) {
        return this.x === v.x && this.y === v.y && this.z === v.z && this.w === v.w
    }

    productOfComponents() {
        return this.x * this.y * this.z * this.w
    }

    equivalent(v: Vector4) {
        return equivalent(this.x, v.x)
            && equivalent(this.y, v.y)
            && equivalent(this.z, v.z)
            && equivalent(this.w, v.w)
    }

    lerp(v: Vector4, alpha: number) {
        return new Vector4(
            this.x + alpha * (v.x - this.x),
            this.y + alpha * (v.y - this.y),
            this.z + alpha * (v.z - this.z),
            this.w + alpha * (v.w - this.w)
        )
    }

    toVector3() {
        return new Vector3(this.x, this.y, this.z)
    }

    toColor() {
        return new Color(this.x, this.y, this.z, this.w)
    }

    transform(m: Matrix4) {
        let { x, y, z, w } = this
        return new Vector4(
            m.m00 * x + m.m10 * y + m.m20 * z + m.m30 * w,
            m.m01 * x + m.m11 * y + m.m21 * z + m.m31 * w,
            m.m02 * x + m.m12 * y + m.m22 * z + m.m32 * w,
            m.m03 * x + m.m13 * y + m.m23 * z + m.m33 * w,
        )
    }

    static zero = new Vector4(0, 0, 0, 0)

    writeTo(array: number[], index: number) {
        array[index + 0] = this.x
        array[index + 1] = this.y
        array[index + 2] = this.z
        array[index + 3] = this.w
    }

    toArray(): [number, number, number, number] {
        return [this.x, this.y, this.z, this.w]
    }

    toFloat32Array() {
        return new Float32Array(this.toArray())
    }

    toString() {
        return `(${this.x},${this.y},${this.z},${this.w})`
    }

}