import { describe, expect, test } from 'vitest'
import { BitArray } from '../BitArray.js';

describe(`BitArray`, () => {
    test(`should set and get values`, async () => {
        const array = new BitArray(64)

        for (let i = 0; i < 64; i++) {
            array.set(i, i % 2)
        }

        for (let i = 0; i < 64; i++) {
            expect(array.get(i)).to.equal(i % 2)
        }
    });
})

