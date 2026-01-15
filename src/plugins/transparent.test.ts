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
    
    // Insert test entities
    db.system.functions.init_test_database();
    
    // Run the transparency marking system
    db.system.functions.markTransparentMaterials();
    
    // Verify transparent materials got the tag (should be 3: air, water, ice)
    const transparentEntities = db.select(["material", "transparent"]);
    expect(transparentEntities.length).toBe(3);
    
    // Verify each entity has the correct material and transparency
    for (const entity of transparentEntities) {
        const material = db.get(entity, "material");
        expect(material).toBeDefined();
        expect(material).not.toBe(Material.id.rock); // Rock should not be transparent
        expect(db.get(entity, "transparent")).toBe(true);
    }
    
    // Verify rock entity does NOT have transparent tag
    const allEntities = db.select(["material"]);
    const rockEntity = allEntities.find(entity => db.get(entity, "material") === Material.id.rock);
    expect(rockEntity).toBeDefined();
    expect(db.get(rockEntity!, "transparent")).toBeUndefined();
});

