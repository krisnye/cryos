/* The arcball camera will be placed at the position 'eye', rotating
 * around the point 'center', with the up vector 'up'. 'screenDims'
 * should be the dimensions of the canvas or region taking mouse input
 * so the mouse positions can be normalized into [-1, 1] from the pixel
 * coordinates.
 */

import { Matrix4 } from "../internal/math/Matrix4.js";
import { Quaternion } from "../internal/math/Quaternion.js";
import { Vector2 } from "../internal/math/Vector2.js";
import { Vector3 } from "../internal/math/Vector3.js";
import { Vector4 } from "../internal/math/Vector4.js";
import { clamp } from "../internal/math/functions.js";

export class ArcballCamera {
    zoomSpeed: number
    invScreen: Vector2
    centerTranslation: Matrix4
    translation: Matrix4
    rotation: Quaternion
    camera = Matrix4.identity
    invCamera = Matrix4.identity

    constructor(eye: Vector3, center: Vector3, up: Vector3, zoomSpeed: number, screenDims: Vector2) {
        let veye = eye
        let vcenter = center
        let vup = up.normalize()
        let zAxis = vcenter.subtract(veye)
        let viewDist = zAxis.length()
        zAxis = zAxis.normalize()
        let xAxis = zAxis.cross(vup).normalize()
        let yAxis = xAxis.cross(zAxis).normalize()
        xAxis = zAxis.cross(yAxis).normalize()

        this.zoomSpeed = zoomSpeed;
        this.invScreen = screenDims.inverse()
        this.centerTranslation = Matrix4.translation(...center.toArray()).inverse()

        let vt = new Vector3(0, 0, - viewDist)
        this.translation = Matrix4.translation(...vt.toArray())

        let rotMat = new Matrix4(
            xAxis.x, xAxis.y, xAxis.z, 0,
            yAxis.x, yAxis.y, yAxis.z, 0,
            -zAxis.x, -zAxis.y, -zAxis.z, 0,
            0, 0, 0, 1
        ).transpose()

        this.rotation = Quaternion.fromMatrix4(rotMat).normalize()
        this.updateCameraMatrix()
    }

    rotate(prevMouse: Vector2, curMouse: Vector2) {
        let mPrev = new Vector2(
            clamp(prevMouse.x * 2 * this.invScreen.x - 1, -1, 1),
            clamp(1 - prevMouse.y * 2 * this.invScreen.y, -1, 1)
        )

        let mCur = new Vector2(
            clamp(curMouse.x * 2 * this.invScreen.x - 1, -1, 1),
            clamp(1 - curMouse.y * 2 * this.invScreen.y, -1, 1)
        )

        let mPrevBall = screenToArcball(mPrev)
        let mCurBall = screenToArcball(mCur)
        // rotation = curBall * prevBall * rotation
        this.rotation = mPrevBall.multiply(this.rotation)
        this.rotation = mCurBall.multiply(this.rotation)

        this.updateCameraMatrix()
    }

    zoom(amount: number) {
        let vt = new Vector3(0, 0, amount * this.invScreen.y * this.zoomSpeed)
        let t = Matrix4.translation(...vt.toArray())
        this.translation = t.multiply(this.translation)
        if (this.translation.m32 >= -0.2) {
            let elements = this.translation.toArray()
            elements[14] = -0.2
            this.translation = new Matrix4(...elements)
        }
        this.updateCameraMatrix()
    }

    pan(mouseDelta: Vector2) {
        let delta = new Vector4(
            mouseDelta.x * this.invScreen.x * Math.abs(this.translation.m32),
            mouseDelta.y * this.invScreen.y * Math.abs(this.translation.m32),
            0,
            0
        )
        let worldDelta = delta.transform(this.invCamera)
        let translation = Matrix4.translation(worldDelta.x, worldDelta.y, worldDelta.z)
        this.centerTranslation = translation.multiply(this.centerTranslation)
        this.updateCameraMatrix()
    }

    updateCameraMatrix() {
        // camera = translation * rotation * centerTranslation
        let rotMat = this.rotation.toMatrix4()
        this.camera = rotMat.multiply(this.centerTranslation)
        this.camera = this.translation.multiply(this.camera)
        this.invCamera = this.camera.inverse()
    }

    eyePos() {
        return new Vector3(this.invCamera.m30, this.invCamera.m31, this.invCamera.m32)
    }

    eyeDir() {
        let dir = new Vector4(0.0, 0.0, -1.0, 0.0)
        dir = dir.transform(this.invCamera).normalize()
        return new Vector3(dir.x, dir.y, dir.z)
    }

    upDir() {
        let dir = new Vector4(0.0, 1.0, 0.0, 0.0)
        dir = dir.transform(this.invCamera).normalize()
        return new Vector3(dir.x, dir.y, dir.z)
    }

}

function screenToArcball(p: Vector2) {
    let dist = p.dot(p)
    if (dist <= 1.0) {
        return new Quaternion(p.x, p.y, Math.sqrt(1.0 - dist), 0)
    } else {
        let unitP = p.normalize()
        // cgmath is w, x, y, z
        // glmatrix is x, y, z, w
        return new Quaternion(unitP.x, unitP.y, 0, 0)
    }
}
