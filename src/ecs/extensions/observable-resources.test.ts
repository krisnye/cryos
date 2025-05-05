import { createDatabase } from "ecs/database/create-database";
import { describe, it, expect } from "vitest";
import { observableResources } from "./observable-resources";
import { toPromise } from "data/observe/to-promise";

describe("addObservableResources", () => {
    it("should add observable resources to the database", async () => {
        const db = createDatabase().withExtension(observableResources({
            alpha: 1,
            beta: "two"
        }));

        expect(db.resources.alpha).toBe(1);
        expect(db.resources.beta).toBe("two");

        const alpha = await toPromise(db.observe.alpha);
        expect(alpha).toBe(1);

        const beta = await toPromise(db.observe.beta);
        expect(beta).toBe("two");

        db.resources.alpha = 2;
        expect(await toPromise(db.observe.alpha)).toBe(2);

        db.resources.beta = "three";
        expect(await toPromise(db.observe.beta)).toBe("three"); 

        const observedAlphaValues: number[] = [];
        const unsubscribeAlpha = db.observe.alpha(value => observedAlphaValues.push(value));
        expect(observedAlphaValues).toEqual([2]);

        db.resources.alpha = 3;
        expect(observedAlphaValues).toEqual([2, 3]);
    });
});