import { describe, expect, test } from 'vitest'
import { Quaternion } from '../Quaternion.js';
import { Matrix4 } from '../Matrix4.js';
import { randomNumberGenerator } from '../RandomNumberGenerator.js';
import { Vector3 } from '../Vector3.js';
import { epsilon } from '../constants.js';

describe(`Quaternion`, () => {
    test(`Quaternion.toMatrix4 vs Matrix4.rotation`, async () => {

        const rng = randomNumberGenerator(39874598763)
        const iterations = 100

        for (let i = 0; i < iterations; i++) {

            let axis = new Vector3(rng(-1, 1), rng(-1, 1), rng(-1, 1))
            if (axis.length() < epsilon)
                continue
            axis = axis.normalize()

            const angle = rng(0, Math.PI * 2)


            const expectedMat = Matrix4.rotation(axis, angle)
            const actualMat = Quaternion.fromAxisAngle(axis, angle).toMatrix4()

            let distSquared = 0
            const expectedArr = Array.from(expectedMat)
            const actualArr = Array.from(actualMat)
            for (let j = 0; j < 16; j++)
                distSquared += (expectedArr[j] - actualArr[j]) ** 2

            expect(distSquared).toBeLessThan(epsilon)

        }

    });
})

