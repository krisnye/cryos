import { Matrix4 } from "../math/Matrix4.js";
import { Vector2 } from "../math/Vector2.js";
import { Vector3 } from "../math/Vector3.js";
import { ArcballCamera } from "./ArcBall.js";

export function useArcBallCamera(element: HTMLElement,
    eye: Vector3, target: Vector3, up: Vector3,
    callback: (view: Matrix4, eye: Vector3) => void) {

    const arcball = new ArcballCamera(
        eye, target, up,
        1,
        new Vector2(element.clientWidth, element.clientHeight)
    )

    // callback once immediately
    callback(arcball.camera, arcball.eyePos())

    let pointerdown = false
    let lastPosition = Vector2.zero
    const updatePosition = (e: PointerEvent) => {
        let position = new Vector2(e.clientX, e.clientY)
        let oldPosition = lastPosition
        lastPosition = position
        return [oldPosition, position]
    }

    const onPointerDown = (e: PointerEvent) => {
        pointerdown = true
        updatePosition(e)
    }

    const onPointerUp = (e: PointerEvent) => {
        pointerdown = false
    }

    const onPointerMove = (e: PointerEvent) => {
        if (pointerdown) {
            let [last, current] = updatePosition(e)
            arcball.rotate(last, current)
            callback(arcball.camera, arcball.eyePos())
        }
    }

    const onPointerLeave = (e: PointerEvent) => {
    }

    element.addEventListener("pointerdown", onPointerDown)
    element.addEventListener("pointerup", onPointerUp)
    element.addEventListener("pointermove", onPointerMove)
    element.addEventListener("pointerleave", onPointerLeave)

    return () => {
        element.removeEventListener("pointerdown", onPointerDown)
        element.removeEventListener("pointerup", onPointerUp)
        element.removeEventListener("pointermove", onPointerMove)
        element.removeEventListener("pointerleave", onPointerLeave)
    }
}