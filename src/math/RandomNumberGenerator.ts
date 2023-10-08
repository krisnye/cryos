
export type RandomNumberGenerator = (min?: number, max?: number) => number

// Source: https://en.wikipedia.org/wiki/Xorshift
export function randomNumberGenerator(seed = Number.MAX_SAFE_INTEGER): RandomNumberGenerator {
    let x = seed
    let coef = 1 / (1 << 31)
    return function random(min = 0, max = 1) {
        x ^= x << 13
        x ^= x >> 7
        x ^= x << 17
        let r = Math.abs(x * coef)
        return min + r * (max - min)
    }
}