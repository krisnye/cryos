import { createDatabase } from "ecs/database/create-database";
import { describe, it, expect } from "vitest";
import { addObservableResources } from "./add-observable-resources";
import { toPromise } from "data/observe/toPromise";

describe("addObservableResources", () => {
    it("should add observable resources to the database", async () => {
        const db = createDatabase();
        const extendedDb = addObservableResources(db, {
            alpha: 1,
            beta: "two"
        });

        expect(extendedDb.resources.alpha).toBe(1);
        expect(extendedDb.resources.beta).toBe("two");

        const alpha = await toPromise(extendedDb.observe.alpha);
        expect(alpha).toBe(1);

        const beta = await toPromise(extendedDb.observe.beta);
        expect(beta).toBe("two");

        extendedDb.resources.alpha = 2;
        expect(await toPromise(extendedDb.observe.alpha)).toBe(2);

        extendedDb.resources.beta = "three";
        expect(await toPromise(extendedDb.observe.beta)).toBe("three"); 

        const observedAlphaValues: number[] = [];
        const unsubscribeAlpha = extendedDb.observe.alpha(value => observedAlphaValues.push(value));
        expect(observedAlphaValues).toEqual([2]);

        extendedDb.resources.alpha = 3;
        expect(observedAlphaValues).toEqual([2, 3]);
    });
});