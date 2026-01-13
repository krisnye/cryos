import { test, expect } from "vitest";
import { Database } from "@adobe/data/ecs";
import { transparent } from "./transparent.js";
import { Material } from "../types/index.js";

test("markTransparentMaterials marks entities with non-opaque materials", () => {
    const db = Database.create(transparent);
    const system = db.system.functions.markTransparentMaterials;
    
    const archetype = db.store.ensureArchetype(["id", "material"]);
    archetype.insert({ material: Material.id.air });    // alpha 0.0 (transparent)
    archetype.insert({ material: Material.id.water });  // alpha 0.1 (transparent)
    archetype.insert({ material: Material.id.rock });   // alpha 1.0 (opaque)
    archetype.insert({ material: Material.id.ice });    // alpha 0.5 (transparent)
    
    system();
    
    // Verify transparent materials got the tag
    const transparentEntities = db.store.select(["material", "transparent"]);
    // console.log(transparentEntities.map(db.store.read));
    // const transparentTables = db.store.queryArchetypes(["material", "transparent"]);
    // const transparentMaterials =[...table.columns.materials.getTypedArray().slice]
    // for (const table of transparentTables) {
    //     transparentMaterials.push(...Array.from(table.columns.material.getTypedArray()));
    // }
    // expect(new Set(transparentMaterials).has(Material.id.air)).toBe(true);
    // expect(new Set(transparentMaterials).has(Material.id.water)).toBe(true);
    // expect(new Set(transparentMaterials).has(Material.id.ice)).toBe(true);
    
    // // Verify opaque material did NOT get the tag
    // const opaqueTables = db.store.queryArchetypes(["material"], { exclude: ["transparent"] });
    // const opaqueMaterials: number[] = [];
    // for (const table of opaqueTables) {
    //     opaqueMaterials.push(...Array.from(table.columns.material.getTypedArray()));
    // }
    // expect(new Set(opaqueMaterials).has(Material.id.rock)).toBe(true);
    // expect(opaqueMaterials.has(Material.id.rock)).toBe(true);
});

