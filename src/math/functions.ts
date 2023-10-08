import { epsilon } from "./constants.js"

export function equivalent(a: number, b: number) {
    return Math.abs(a - b) <= epsilon * Math.max(1, Math.abs(a), Math.abs(b))
}

export function clamp(value: number, min: number = 0, max: number = 1) {
    return value < min ? min : value > max ? max : value
}

export function lerp(a: any, b: any, alpha = 0.5) {
    if (typeof a === "number") {
        return a * (1 - alpha) + b * alpha
    }
    return a.lerp(b, alpha)
}

export function easeInOutCubic(x: number) {
    return x ** 2 * 3 - x ** 3 * 2
}
