import { describe, it, expect } from "vitest";
import { createStore } from "./create-store";
import { createCoreTestSuite, positionSchema, healthSchema } from "../core/create-core.test";
import { F32Schema, Schema } from "data";

describe("createStore", () => {
    // Test that store passes all core functionality tests
    createCoreTestSuite("Store core functionality", (componentSchemas) => 
        createStore(componentSchemas, {})
    );

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