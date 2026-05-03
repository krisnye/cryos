import { describe, expect, test } from "vitest";
import { MaterialCollision } from "./material-collision.js";
import { MaterialCollisionInput } from "./material-collision-input.js";
import { MaterialCollisionResult } from "./material-collision-result.js";

describe("MaterialCollision contract", () => {
    test("requires complete input and complete output shape", () => {
        const input: MaterialCollisionInput = {
            a: {
                materialId: 1,
                volumeM3: 0.125,
                velocity: [25, 0, 0],
                health: 1,
            },
            b: {
                materialId: 2,
                volumeM3: 0.25,
                velocity: [0, 0, 0],
                health: 1,
            },
            contactNormal: [1, 0, 0],
            contactAreaM2: 0.01,
            timeStepSeconds: 1 / 60,
        };

        const solver: MaterialCollision = (solveInput) => {
            const relativeNormalSpeedMps =
                solveInput.a.velocity[0] - solveInput.b.velocity[0];

            const result: MaterialCollisionResult = {
                relativeNormalSpeedMps,
                impulseNs: 0,
                impactEnergyJ: 0,
                damageToA: 0,
                damageToB: 0,
                nextHealthA: solveInput.a.health,
                nextHealthB: solveInput.b.health,
                fracturedA: false,
                fracturedB: false,
            };

            return result;
        };

        const result = solver(input);

        expect(result).toEqual({
            relativeNormalSpeedMps: 25,
            impulseNs: 0,
            impactEnergyJ: 0,
            damageToA: 0,
            damageToB: 0,
            nextHealthA: 1,
            nextHealthB: 1,
            fracturedA: false,
            fracturedB: false,
        });
    });
});
