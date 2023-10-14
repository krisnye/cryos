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

export function hypot2(x: number, y: number) {
    return Math.sqrt(x * x + y * y)
}

export function hypot3(x: number, y: number, z: number) {
    return Math.sqrt(x * x + y * y + z * z)
}

export function arrayEqualsPercent<T>(arr1: ArrayLike<T>, arr2: ArrayLike<T>): number {
    let same = 0
    for (let i = 0; i < arr1.length; i++) {
        if (arr1[i] === arr2[i]) {
            same++
        }
    }

    return same / arr1.length
}

export function arrayEquals<T>(arr1: ArrayLike<T>, arr2: ArrayLike<T>): boolean {
    if (arr1.length !== arr2.length) {
        return false;
    }

    for (let i = 0; i < arr1.length; i++) {
        if (arr1[i] !== arr2[i]) {
            return false;
        }
    }

    return true;
}
