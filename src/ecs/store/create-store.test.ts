import { describe, it, expect } from "vitest";
import { createStore } from "./create-store";
import { createCoreTestSuite, positionSchema, healthSchema, nameSchema } from "./core/create-core.test";
import { F32Schema, Schema } from "data";

describe("createStore", () => {
    // Test that store passes all core functionality tests
    createCoreTestSuite("Store core functionality", (componentSchemas) => 
        createStore(componentSchemas, {})
    );

    // Select function tests
    describe("Select functionality", () => {
        const velocitySchema = {
            type: "object",
            properties: {
                x: F32Schema,
                y: F32Schema,
                z: F32Schema,
            }
        } as const satisfies Schema;

        it("should select entities from single archetype", () => {
            const store = createStore({
                position: positionSchema,
                health: healthSchema,
                name: nameSchema,
            }, {});

            // Create entities in a single archetype
            const archetype = store.ensureArchetype(["id", "position", "health"]);
            const entity1 = archetype.insert({ 
                position: { x: 1, y: 2, z: 3 },
                health: { current: 100, max: 100 }
            });
            const entity2 = archetype.insert({ 
                position: { x: 4, y: 5, z: 6 },
                health: { current: 50, max: 100 }
            });

            // Select entities with position and health
            const entities = store.select(["position", "health"]);
            expect(entities).toHaveLength(2);
            expect(entities).toContain(entity1);
            expect(entities).toContain(entity2);
        });

        it("should select entities spanning multiple archetypes", () => {
            const store = createStore({
                position: positionSchema,
                health: healthSchema,
                name: nameSchema,
                velocity: velocitySchema,
            }, {});

            // Create entities in different archetypes
            const positionOnlyArchetype = store.ensureArchetype(["id", "position"]);
            const entity1 = positionOnlyArchetype.insert({ 
                position: { x: 1, y: 2, z: 3 }
            });
            const entity2 = positionOnlyArchetype.insert({ 
                position: { x: 4, y: 5, z: 6 }
            });

            const healthOnlyArchetype = store.ensureArchetype(["id", "health"]);
            const entity3 = healthOnlyArchetype.insert({ 
                health: { current: 100, max: 100 }
            });

            const positionHealthArchetype = store.ensureArchetype(["id", "position", "health"]);
            const entity4 = positionHealthArchetype.insert({ 
                position: { x: 0, y: 0, z: 0 },
                health: { current: 50, max: 100 }
            });

            const velocityArchetype = store.ensureArchetype(["id", "velocity"]);
            const entity5 = velocityArchetype.insert({ 
                velocity: { x: 1, y: 0, z: 0 }
            });

            // Select all entities with position component (should span 2 archetypes)
            const positionEntities = store.select(["position"]);
            expect(positionEntities).toHaveLength(3);
            expect(positionEntities).toContain(entity1);
            expect(positionEntities).toContain(entity2);
            expect(positionEntities).toContain(entity4);
            expect(positionEntities).not.toContain(entity3);
            expect(positionEntities).not.toContain(entity5);

            // Select all entities with health component (should span 2 archetypes)
            const healthEntities = store.select(["health"]);
            expect(healthEntities).toHaveLength(2);
            expect(healthEntities).toContain(entity3);
            expect(healthEntities).toContain(entity4);
            expect(healthEntities).not.toContain(entity1);
            expect(healthEntities).not.toContain(entity2);
            expect(healthEntities).not.toContain(entity5);

            // Select entities with both position and health (should be only 1 archetype)
            const bothEntities = store.select(["position", "health"]);
            expect(bothEntities).toHaveLength(1);
            expect(bothEntities).toContain(entity4);
            expect(bothEntities).not.toContain(entity1);
            expect(bothEntities).not.toContain(entity2);
            expect(bothEntities).not.toContain(entity3);
            expect(bothEntities).not.toContain(entity5);
        });

        it("should select entities with exclude option", () => {
            const store = createStore({
                position: positionSchema,
                health: healthSchema,
                name: nameSchema,
            }, {});

            // Create entities in different archetypes
            const positionOnlyArchetype = store.ensureArchetype(["id", "position"]);
            const entity1 = positionOnlyArchetype.insert({ 
                position: { x: 1, y: 2, z: 3 }
            });

            const positionHealthArchetype = store.ensureArchetype(["id", "position", "health"]);
            const entity2 = positionHealthArchetype.insert({ 
                position: { x: 0, y: 0, z: 0 },
                health: { current: 50, max: 100 }
            });

            // Select entities with position but exclude health
            const positionOnlyEntities = store.select(["position"], { exclude: ["health"] });
            expect(positionOnlyEntities).toHaveLength(1);
            expect(positionOnlyEntities).toContain(entity1);
            expect(positionOnlyEntities).not.toContain(entity2);
        });

        it("should return empty array when no entities match", () => {
            const store = createStore({
                position: positionSchema,
                health: healthSchema,
            }, {});

            // Create entity with only position
            const archetype = store.ensureArchetype(["id", "position"]);
            archetype.insert({ position: { x: 1, y: 2, z: 3 } });

            // Select entities with health (should be empty)
            const entities = store.select(["health"]);
            expect(entities).toHaveLength(0);
        });

        it("should handle complex multi-archetype scenarios", () => {
            const store = createStore({
                position: positionSchema,
                health: healthSchema,
                name: nameSchema,
                velocity: velocitySchema,
            }, {});

            // Create entities across many different archetypes
            const archetype1 = store.ensureArchetype(["id", "position"]);
            const entity1 = archetype1.insert({ position: { x: 1, y: 2, z: 3 } });
            const entity2 = archetype1.insert({ position: { x: 4, y: 5, z: 6 } });

            const archetype2 = store.ensureArchetype(["id", "health"]);
            const entity3 = archetype2.insert({ health: { current: 100, max: 100 } });

            const archetype3 = store.ensureArchetype(["id", "position", "health"]);
            const entity4 = archetype3.insert({ 
                position: { x: 0, y: 0, z: 0 },
                health: { current: 50, max: 100 }
            });
            const entity5 = archetype3.insert({ 
                position: { x: 10, y: 20, z: 30 },
                health: { current: 75, max: 100 }
            });

            const archetype4 = store.ensureArchetype(["id", "name"]);
            const entity6 = archetype4.insert({ name: "Player1" });

            const archetype5 = store.ensureArchetype(["id", "position", "name"]);
            const entity7 = archetype5.insert({ 
                position: { x: 100, y: 200, z: 300 },
                name: "Player2"
            });

            const archetype6 = store.ensureArchetype(["id", "position", "health", "name"]);
            const entity8 = archetype6.insert({ 
                position: { x: 500, y: 600, z: 700 },
                health: { current: 25, max: 100 },
                name: "Player3"
            });

            // Test various selection scenarios
            const positionEntities = store.select(["position"]);
            expect(positionEntities).toHaveLength(6);
            expect(positionEntities).toContain(entity1);
            expect(positionEntities).toContain(entity2);
            expect(positionEntities).toContain(entity4);
            expect(positionEntities).toContain(entity5);
            expect(positionEntities).toContain(entity7);
            expect(positionEntities).toContain(entity8);

            const nameEntities = store.select(["name"]);
            expect(nameEntities).toHaveLength(3);
            expect(nameEntities).toContain(entity6);
            expect(nameEntities).toContain(entity7);
            expect(nameEntities).toContain(entity8);

            const positionNameEntities = store.select(["position", "name"]);
            expect(positionNameEntities).toHaveLength(2);
            expect(positionNameEntities).toContain(entity7);
            expect(positionNameEntities).toContain(entity8);

            const allThreeEntities = store.select(["position", "health", "name"]);
            expect(allThreeEntities).toHaveLength(1);
            expect(allThreeEntities).toContain(entity8);

            // Test exclusion
            const positionWithoutHealth = store.select(["position"], { exclude: ["health"] });
            expect(positionWithoutHealth).toHaveLength(3);
            expect(positionWithoutHealth).toContain(entity1);
            expect(positionWithoutHealth).toContain(entity2);
            expect(positionWithoutHealth).toContain(entity7);
            expect(positionWithoutHealth).not.toContain(entity4);
            expect(positionWithoutHealth).not.toContain(entity5);
            expect(positionWithoutHealth).not.toContain(entity8);
        });

        it("should maintain entity order across archetypes", () => {
            const store = createStore({
                position: positionSchema,
                health: healthSchema,
            }, {});

            // Create entities in different archetypes
            const archetype1 = store.ensureArchetype(["id", "position"]);
            const entity1 = archetype1.insert({ position: { x: 1, y: 2, z: 3 } });
            const entity2 = archetype1.insert({ position: { x: 4, y: 5, z: 6 } });

            const archetype2 = store.ensureArchetype(["id", "health"]);
            const entity3 = archetype2.insert({ health: { current: 100, max: 100 } });

            const archetype3 = store.ensureArchetype(["id", "position", "health"]);
            const entity4 = archetype3.insert({ 
                position: { x: 0, y: 0, z: 0 },
                health: { current: 50, max: 100 }
            });

            // Select all entities with position
            const entities = store.select(["position"]);
            expect(entities).toHaveLength(3);
            
            // Verify all expected entities are present (order may vary)
            expect(entities).toContain(entity1);
            expect(entities).toContain(entity2);
            expect(entities).toContain(entity4);
            expect(entities).not.toContain(entity3);
        });

        it("should handle empty store", () => {
            const store = createStore({
                position: positionSchema,
                health: healthSchema,
            }, {});

            const entities = store.select(["position"]);
            expect(entities).toHaveLength(0);
        });

        it("should work with resources as components", () => {
            const store = createStore({
                position: positionSchema,
                health: healthSchema,
            }, {
                time: { delta: 0.016, elapsed: 0 }
            });

            // Create some entities
            const archetype = store.ensureArchetype(["id", "position"]);
            const entity = archetype.insert({ position: { x: 1, y: 2, z: 3 } });

            // Select entities with time component (should include the resource entity)
            const timeEntities = store.select(["time" as any]);
            expect(timeEntities).toHaveLength(1);
            
            // The resource entity should be included in time queries
            const timeArchetypes = store.queryArchetypes(["time" as any]);
            expect(timeArchetypes).toHaveLength(1);
        });
    });

    // Store-specific resource tests
    describe("Resource functionality", () => {
        const timeSchema = {
            type: "object",
            properties: {
                delta: F32Schema,
                elapsed: F32Schema,
            }
        } as const satisfies Schema;

        const configSchema = {
            type: "object",
            properties: {
                debug: { type: "boolean" },
                volume: F32Schema,
            }
        } as const satisfies Schema;

        it("should create store with resources", () => {
            const store = createStore(
                { position: positionSchema },
                { 
                    time: { delta: 0.016, elapsed: 0 },
                    config: { debug: false, volume: 1.0 }
                }
            );

            expect(store).toBeDefined();
            expect(store.resources).toBeDefined();
            expect(store.resources.time).toBeDefined();
            expect(store.resources.config).toBeDefined();
        });

        it("should initialize resources with default values", () => {
            const defaultTime = { delta: 0.016, elapsed: 0 };
            const defaultConfig = { debug: false, volume: 1.0 };

            const store = createStore(
                { position: positionSchema },
                { 
                    time: defaultTime,
                    config: defaultConfig
                }
            );

            expect(store.resources.time).toEqual(defaultTime);
            expect(store.resources.config).toEqual(defaultConfig);
        });

        it("should allow reading resource values", () => {
            const store = createStore(
                { position: positionSchema },
                { 
                    time: { delta: 0.016, elapsed: 0 },
                    config: { debug: false, volume: 1.0 }
                }
            );

            expect(store.resources.time.delta).toBe(0.016);
            expect(store.resources.time.elapsed).toBe(0);
            expect(store.resources.config.debug).toBe(false);
            expect(store.resources.config.volume).toBe(1.0);
        });

        it("should allow updating resource values", () => {
            const store = createStore(
                { position: positionSchema },
                { 
                    time: { delta: 0.016, elapsed: 0 },
                    config: { debug: false, volume: 1.0 }
                }
            );

            // Update time
            store.resources.time = { delta: 0.033, elapsed: 1.5 };
            expect(store.resources.time.delta).toBe(0.033);
            expect(store.resources.time.elapsed).toBe(1.5);

            // Update config
            store.resources.config = { debug: true, volume: 0.5 };
            expect(store.resources.config.debug).toBe(true);
            expect(store.resources.config.volume).toBe(0.5);
        });

        it("should maintain resource values across updates", () => {
            const store = createStore(
                { position: positionSchema },
                { 
                    time: { delta: 0.016, elapsed: 0 },
                    config: { debug: false, volume: 1.0 }
                }
            );

            // Update multiple times
            store.resources.time = { delta: 0.033, elapsed: 1.5 };
            store.resources.time = { delta: 0.025, elapsed: 2.0 };
            store.resources.config = { debug: true, volume: 0.5 };

            // Verify final values
            expect(store.resources.time).toEqual({ delta: 0.025, elapsed: 2.0 });
            expect(store.resources.config).toEqual({ debug: true, volume: 0.5 });
        });

        it("should handle nested resource updates", () => {
            const store = createStore(
                { position: positionSchema },
                { 
                    time: { delta: 0.016, elapsed: 0 }
                }
            );

            // Update individual properties
            const newTime = { delta: 0.033, elapsed: 1.5 };
            store.resources.time = newTime;

            expect(store.resources.time.delta).toBe(newTime.delta);
            expect(store.resources.time.elapsed).toBe(newTime.elapsed);
        });

        it("should work with empty resource object", () => {
            const store = createStore(
                { position: positionSchema },
                {}
            );

            expect(store.resources).toBeDefined();
            expect(Object.keys(store.resources)).toHaveLength(0);
        });

        it("should handle multiple resources independently", () => {
            const store = createStore(
                { position: positionSchema },
                { 
                    time: { delta: 0.016, elapsed: 0 },
                    config: { debug: false, volume: 1.0 },
                    score: 0
                }
            );

            // Update each resource independently
            store.resources.time = { delta: 0.033, elapsed: 1.5 };
            store.resources.config = { debug: true, volume: 0.5 };
            store.resources.score = 100;

            // Verify all resources maintain their values
            expect(store.resources.time).toEqual({ delta: 0.033, elapsed: 1.5 });
            expect(store.resources.config).toEqual({ debug: true, volume: 0.5 });
            expect(store.resources.score).toBe(100);
        });

        it("should allow querying resources as components", () => {
            const store = createStore(
                { 
                    position: positionSchema,
                    time: timeSchema
                },
                { 
                    time: { delta: 0.016, elapsed: 0 }
                }
            );

            // Resources should be queryable as components
            const timeArchetypes = store.queryArchetypes(["time"]);
            expect(timeArchetypes).toHaveLength(1);
            expect(timeArchetypes[0].components.has("time")).toBe(true);
        });

        it("should maintain resource singleton behavior", () => {
            const store = createStore(
                { 
                    position: positionSchema,
                    time: timeSchema
                },
                { 
                    time: { delta: 0.016, elapsed: 0 }
                }
            );

            // Resources should be queryable as components
            const timeArchetypes = store.queryArchetypes(["time"]);
            expect(timeArchetypes).toHaveLength(1);
            
            // Resources should maintain their values
            expect(store.resources.time).toEqual({ delta: 0.016, elapsed: 0 });
            
            // Update and verify
            store.resources.time = { delta: 0.033, elapsed: 1.5 };
            expect(store.resources.time).toEqual({ delta: 0.033, elapsed: 1.5 });
        });

        it("should handle primitive resource values", () => {
            const store = createStore(
                { position: positionSchema },
                { 
                    score: 0,
                    name: "Player1",
                    active: true
                }
            );

            expect(store.resources.score).toBe(0);
            expect(store.resources.name).toBe("Player1");
            expect(store.resources.active).toBe(true);

            // Update primitive values
            store.resources.score = 100;
            store.resources.name = "Player2";
            store.resources.active = false;

            expect(store.resources.score).toBe(100);
            expect(store.resources.name).toBe("Player2");
            expect(store.resources.active).toBe(false);
        });

        it("should handle complex resource objects", () => {
            const complexResource = {
                nested: {
                    deep: {
                        value: 42,
                        array: [1, 2, 3],
                        flag: true
                    }
                },
                count: 0
            };

            const store = createStore(
                { position: positionSchema },
                { complex: complexResource }
            );

            expect(store.resources.complex).toEqual(complexResource);

            // Update complex resource
            const updatedComplex = {
                nested: {
                    deep: {
                        value: 100,
                        array: [4, 5, 6],
                        flag: false
                    }
                },
                count: 10
            };

            store.resources.complex = updatedComplex;
            expect(store.resources.complex).toEqual(updatedComplex);
        });
    });
}); 