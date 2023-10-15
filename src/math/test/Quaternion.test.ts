import { describe, expect, test } from 'vitest'
import { Quaternion } from '../Quaternion.js'
import { Matrix4 } from '../Matrix4.js'
import { RandomNumberGenerator, randomNumberGenerator } from '../RandomNumberGenerator.js'
import { Vector3 } from '../Vector3.js'
import { epsilon } from '../constants.js'

function matrixDistanceSquared(A: Matrix4, B: Matrix4) {
    let a = Array.from(A)
    let b = Array.from(B)
    let distSquared = 0
    for (let j = 0; j < 16; j++)
        distSquared += (a[j] - b[j]) ** 2
    return distSquared
}

function expectMatrixEqual(A: Matrix4, B: Matrix4) {
    try {
        expect(matrixDistanceSquared(A, B)).toBeLessThan(epsilon)
    } catch (e) {
        console.log("Expected:\n" + A.toString())
        console.log("Actual:\n" + B.toString())
        throw e
    }
}

function randomRotation(rng: RandomNumberGenerator) {
    while (true) {
        let axis = new Vector3(rng(-1, 1), rng(-1, 1), rng(-1, 1))
        if (axis.length() < epsilon)
            continue
        axis = axis.normalize()
        const angle = rng(0, Math.PI * 2)
        return { axis, angle }
    }
}

describe(`Quaternion`, () => {

    test(`Quaternion.toMatrix4 vs Matrix4.rotation`, async () => {
        const rng = randomNumberGenerator(39874598763)
        for (let i = 0; i < 100; i++) {
            const { axis, angle } = randomRotation(rng)
            expectMatrixEqual(
                Matrix4.rotation(axis, angle),
                Quaternion.fromAxisAngle(axis, angle).toMatrix4()
            )
        }
    })

    test(`Quaternion.toMatrix4/fromMatrix4 round trip`, async () => {
        const rng = randomNumberGenerator(39874598763)
        for (let i = 0; i < 100; i++) {
            const { axis, angle } = randomRotation(rng)
            let expectedMat = Matrix4.rotation(axis, angle)
            let quat = Quaternion.fromMatrix4(expectedMat)
            let actualMat = quat.toMatrix4()
            expectMatrixEqual(expectedMat, actualMat)
        }
    })
})

