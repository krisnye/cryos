import { Vector3 } from "./Vector3.js"
import { epsilon } from "./constants.js";

export class Matrix4 {

    readonly m00: number; readonly m01: number; readonly m02: number; readonly m03: number;
    readonly m10: number; readonly m11: number; readonly m12: number; readonly m13: number;
    readonly m20: number; readonly m21: number; readonly m22: number; readonly m23: number;
    readonly m30: number; readonly m31: number; readonly m32: number; readonly m33: number;

    constructor(
        m00: number, m01: number, m02: number, m03: number,
        m10: number, m11: number, m12: number, m13: number,
        m20: number, m21: number, m22: number, m23: number,
        m30: number, m31: number, m32: number, m33: number
    ) {
        this.m00 = m00; this.m01 = m01; this.m02 = m02; this.m03 = m03;
        this.m10 = m10; this.m11 = m11; this.m12 = m12; this.m13 = m13;
        this.m20 = m20; this.m21 = m21; this.m22 = m22; this.m23 = m23;
        this.m30 = m30; this.m31 = m31; this.m32 = m32; this.m33 = m33;
    }

    get length() {
        return 16
    }

    multiply(b: Matrix4) {
        let a = this
        return new Matrix4(
            a.m00 * b.m00 + a.m10 * b.m01 + a.m20 * b.m02 + a.m30 * b.m03,
            a.m01 * b.m00 + a.m11 * b.m01 + a.m21 * b.m02 + a.m31 * b.m03,
            a.m02 * b.m00 + a.m12 * b.m01 + a.m22 * b.m02 + a.m32 * b.m03,
            a.m03 * b.m00 + a.m13 * b.m01 + a.m23 * b.m02 + a.m33 * b.m03,

            a.m00 * b.m10 + a.m10 * b.m11 + a.m20 * b.m12 + a.m30 * b.m13,
            a.m01 * b.m10 + a.m11 * b.m11 + a.m21 * b.m12 + a.m31 * b.m13,
            a.m02 * b.m10 + a.m12 * b.m11 + a.m22 * b.m12 + a.m32 * b.m13,
            a.m03 * b.m10 + a.m13 * b.m11 + a.m23 * b.m12 + a.m33 * b.m13,

            a.m00 * b.m20 + a.m10 * b.m21 + a.m20 * b.m22 + a.m30 * b.m23,
            a.m01 * b.m20 + a.m11 * b.m21 + a.m21 * b.m22 + a.m31 * b.m23,
            a.m02 * b.m20 + a.m12 * b.m21 + a.m22 * b.m22 + a.m32 * b.m23,
            a.m03 * b.m20 + a.m13 * b.m21 + a.m23 * b.m22 + a.m33 * b.m23,

            a.m00 * b.m30 + a.m10 * b.m31 + a.m20 * b.m32 + a.m30 * b.m33,
            a.m01 * b.m30 + a.m11 * b.m31 + a.m21 * b.m32 + a.m31 * b.m33,
            a.m02 * b.m30 + a.m12 * b.m31 + a.m22 * b.m32 + a.m32 * b.m33,
            a.m03 * b.m30 + a.m13 * b.m31 + a.m23 * b.m32 + a.m33 * b.m33
        )
    }

    inverse() {
        let {
            m00, m01, m02, m03,
            m10, m11, m12, m13,
            m20, m21, m22, m23,
            m30, m31, m32, m33
        } = this

        let b00 = m00 * m11 - m01 * m10
        let b01 = m00 * m12 - m02 * m10
        let b02 = m00 * m13 - m03 * m10
        let b03 = m01 * m12 - m02 * m11
        let b04 = m01 * m13 - m03 * m11
        let b05 = m02 * m13 - m03 * m12
        let b06 = m20 * m31 - m21 * m30
        let b07 = m20 * m32 - m22 * m30
        let b08 = m20 * m33 - m23 * m30
        let b09 = m21 * m32 - m22 * m31
        let b10 = m21 * m33 - m23 * m31
        let b11 = m22 * m33 - m23 * m32

        // Calculate the determinant
        let det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06

        if (!det) {
            throw new Error("Cannot invert matrix")
        }
        det = 1.0 / det

        return new Matrix4(
            (m11 * b11 - m12 * b10 + m13 * b09) * det,
            (m02 * b10 - m01 * b11 - m03 * b09) * det,
            (m31 * b05 - m32 * b04 + m33 * b03) * det,
            (m22 * b04 - m21 * b05 - m23 * b03) * det,
            (m12 * b08 - m10 * b11 - m13 * b07) * det,
            (m00 * b11 - m02 * b08 + m03 * b07) * det,
            (m32 * b02 - m30 * b05 - m33 * b01) * det,
            (m20 * b05 - m22 * b02 + m23 * b01) * det,
            (m10 * b10 - m11 * b08 + m13 * b06) * det,
            (m01 * b08 - m00 * b10 - m03 * b06) * det,
            (m30 * b04 - m31 * b02 + m33 * b00) * det,
            (m21 * b02 - m20 * b04 - m23 * b00) * det,
            (m11 * b07 - m10 * b09 - m12 * b06) * det,
            (m00 * b09 - m01 * b07 + m02 * b06) * det,
            (m31 * b01 - m30 * b03 - m32 * b00) * det,
            (m20 * b03 - m21 * b01 + m22 * b00) * det,
        )
    }

    toArray() {
        return [
            this.m00, this.m01, this.m02, this.m03,
            this.m10, this.m11, this.m12, this.m13,
            this.m20, this.m21, this.m22, this.m23,
            this.m30, this.m31, this.m32, this.m33
        ]
    }

    toFloat32Array() {
        return new Float32Array(this.toArray())
    }

    equals(b: Matrix4) {
        let a = this
        if (a === b) {
            return true
        }
        if (!(b instanceof Matrix4)) {
            return false
        }
        return a.m00 === b.m00 && a.m01 === b.m01 && a.m02 === b.m02 && a.m03 === b.m03
            && a.m10 === b.m10 && a.m11 === b.m11 && a.m12 === b.m12 && a.m13 === b.m13
            && a.m20 === b.m20 && a.m21 === b.m21 && a.m22 === b.m22 && a.m23 === b.m23
            && a.m30 === b.m30 && a.m31 === b.m31 && a.m32 === b.m32 && a.m33 === b.m33
    }

    static multiply(a?: Matrix4 | null, b?: Matrix4 | null): Matrix4 | null {
        if (a == null) {
            return b || null
        }
        if (b == null) {
            return a || null
        }
        return a.multiply(b)
    }

    static identity = new Matrix4(
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1
    )

    static rotation(axis: Vector3, angle: number) {
        let { x, y, z } = axis
        let len = Math.hypot(x, y, z)
        let s, c, t

        if (len < epsilon) {
            throw new Error()
        }

        len = 1 / len
        x *= len
        y *= len
        z *= len

        s = Math.sin(angle)
        c = Math.cos(angle)
        t = 1 - c;

        return new Matrix4(
            x * x * t + c,
            y * x * t + z * s,
            z * x * t - y * s,
            0,
            x * y * t - z * s,
            y * y * t + c,
            z * y * t + x * s,
            0,
            x * z * t + y * s,
            y * z * t - x * s,
            z * z * t + c,
            0,
            0,
            0,
            0,
            1,
        )
    }

    static scaling(x: number, y: number = x, z: number = y) {
        return new Matrix4(
            x, 0, 0, 0,
            0, y, 0, 0,
            0, 0, z, 0,
            0, 0, 0, 1
        )
    }

    static translation(x: number, y: number, z: number) {
        return new Matrix4(
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            x, y, z, 1
        )
    }

    // https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_model_view_projection#Perspective_Matrix
    static perspective(fov: number, aspect: number, near: number, far: number) {
        let f = 1.0 / Math.tan(fov / 2.0)
        let rangeInv = 1.0 / (near - far)
        return new Matrix4(
            f / aspect, 0, 0, 0,
            0, f, 0, 0,
            0, 0, (near + far) * rangeInv, -1,
            0, 0, near * far * rangeInv * 2, 0
        )
    }

    static orthographic(left: number, right: number, bottom: number, top: number, near: number, far: number) {
        const lr = 1 / (left - right)
        const bt = 1 / (bottom - top)
        const nf = 1 / (near - far)
        return new Matrix4(
            -2 * lr, 0, 0, 0,
            0, -2 * bt, 0, 0,
            0, 0, 2 * nf, 0,
            (left + right) * lr, (top + bottom) * bt, (far + near) * nf, 1
        )
    }

    static lookAt(eye: Vector3, center: Vector3, up: Vector3) {
        let z0 = eye.x - center.x
        let z1 = eye.y - center.y
        let z2 = eye.z - center.z
        let inverseZLength = 1 / Math.hypot(z0, z1, z2)
        z0 *= inverseZLength
        z1 *= inverseZLength
        z2 *= inverseZLength
        let x0 = up.y * z2 - up.z * z1
        let x1 = up.z * z0 - up.x * z2
        let x2 = up.x * z1 - up.y * z0
        let xLength = Math.hypot(x0, x1, x2)
        if (!xLength) {
            x0 = x1 = x2 = 0
        }
        else {
            x0 /= xLength
            x1 /= xLength
            x2 /= xLength
        }
        let y0 = z1 * x2 - z2 * x1
        let y1 = z2 * x0 - z0 * x2
        let y2 = z0 * x1 - z1 * x0
        let yLength = Math.hypot(y0, y1, y2)
        if (!yLength) {
            y0 = y1 = y2 = 0
        }
        else {
            y0 /= yLength
            y1 /= yLength
            y2 /= yLength
        }

        return new Matrix4(
            x0, y0, z0, 0,
            x1, y1, z1, 0,
            x2, y2, z2, 0,
            -(x0 * eye.x + x1 * eye.y + x2 * eye.z),
            -(y0 * eye.x + y1 * eye.y + y2 * eye.z),
            -(z0 * eye.x + z1 * eye.y + z2 * eye.z),
            1
        )
    }

    static transformation(
        translation: Vector3,
        scaling: Vector3 = new Vector3(1, 1, 1),
        axis: Vector3 = new Vector3(0, 0, 0),
        angle = 0
    ) {
        // TODO: This can be made much more efficient than this later.
        let transform = Matrix4.translation(translation.x, translation.y, translation.z)
        if (scaling.x !== 1 || scaling.y !== 1 || scaling.z != 1) {
            transform = transform.multiply(Matrix4.scaling(scaling.x, scaling.y, scaling.z))
        }
        if (angle !== 0) {
            transform = transform.multiply(Matrix4.rotation(axis, angle)!)
        }
        return transform
    }

}