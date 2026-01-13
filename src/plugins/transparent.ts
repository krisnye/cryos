import { Database } from "@adobe/data/ecs";
import { True } from "@adobe/data/schema";
import { materials } from "./materials.js";
import { Material } from "../types/index.js";

export const transparent = Database.Plugin.create({
    components: {
        transparent: True.schema,
    },
    systems: {
        markTransparentMaterials: {
            create: (db) => {
                // Cache for material transparency lookup (indexed by material index)
                let materialTransparentCache: boolean[] = [];

                return () => {
                    // Initialize or update cache if material count changed
                    if (Material.materials.length !== materialTransparentCache.length) {
                        materialTransparentCache.length = Material.materials.length;
                        for (let i = 0; i < Material.materials.length; i++) {
                            // Check if material is not fully opaque (alpha < 1.0)
                            materialTransparentCache[i] = Material.materials[i].baseColor[3] < 1.0;
                        }
                    }

                    // Query entities with material but without transparent tag
                    const tables = db.store.queryArchetypes(["material"], { exclude: ["transparent"] });
                    
                    for (const table of tables) {
                        const entityIds = table.columns.id.getTypedArray();
                        const materialIndices = table.columns.material.getTypedArray();
                        for (let i = table.rowCount - 1; i >= 0; i--) {
                            // Quick O(1) lookup using cached array
                            if (materialTransparentCache[materialIndices[i]]) {
                                db.store.update(entityIds[i], { transparent: true });
                            }
                        }
                    }
                };
            },
            schedule: { during: ["update"] }
        }
    },
    extends: materials
});

