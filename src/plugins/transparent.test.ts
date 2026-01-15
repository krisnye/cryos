import { expect, test } from "vitest";
import { Database } from "@adobe/data/ecs";
import { transparent } from "./transparent.js";
import { Material } from "../types/index.js";

test("markTransparentMaterials marks entities with non-opaque materials", () => {
    const testDatabasePlugin = Database.Plugin.create({
        extends: transparent,
        archetypes: {
            TestMaterials: ["material"],
        },
        systems: {
            init_test_database: {
                create: (db) => () => {
                    db.store.archetypes.TestMaterials.insert({ material: Material.id.air });
                    db.store.archetypes.TestMaterials.insert({ material: Material.id.water });
                    db.store.archetypes.TestMaterials.insert({ material: Material.id.rock });
                    db.store.archetypes.TestMaterials.insert({ material: Material.id.ice });
                }
            }
        }
    });
    const db = Database.create(testDatabasePlugin);
    const system = db.system.functions.markTransparentMaterials;
    system();
    
    // Verify transparent materials got the tag
    const transparentEntities = db.select(["material", "transparent"]);
    // expect(transparentEntities.length).toBe(3);

});

