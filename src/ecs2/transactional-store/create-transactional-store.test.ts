import { describe, it, expect } from "vitest";
import { createTransactionalStore } from "./create-transactional-store";
import { createStore } from "../store/create-store";
import { F32Schema, Schema } from "data";

// Test schemas
const positionSchema = {
    type: "object",
    properties: {
        x: F32Schema,
        y: F32Schema,
        z: F32Schema,
    }
} as const satisfies Schema;

const healthSchema = {
    type: "object",
    properties: {
        current: F32Schema,
        max: F32Schema,
    }
} as const satisfies Schema;

describe("createTransactionalStore", () => {
    it("should create transactional store with basic components", () => {
        const baseStore = createStore(
            { position: positionSchema, health: healthSchema },
            { time: { delta: 0.016, elapsed: 0 } }
        );
        
        const store = createTransactionalStore(baseStore);

        expect(store).toBeDefined();
        expect(store.componentSchemas).toHaveProperty("id");
        expect(store.componentSchemas).toHaveProperty("position");
        expect(store.componentSchemas).toHaveProperty("health");
        expect(store.resources).toHaveProperty("time");
    });

    it("should execute transactions successfully", () => {
        const baseStore = createStore(
            { position: positionSchema, health: healthSchema },
            { time: { delta: 0.016, elapsed: 0 } }
        );
        
        const store = createTransactionalStore(baseStore);

        const result = store.execute((transactionStore) => {
            // Create an entity
            const archetype = transactionStore.ensureArchetype(["id", "position"]);
            const entity = archetype.insert({ position: { x: 1, y: 2, z: 3 } });

            // Update the entity
            transactionStore.update(entity, { position: { x: 10, y: 20, z: 30 } });

            // Update resources
            transactionStore.resources.time = { delta: 0.032, elapsed: 1 };
        });

        expect(result).toBeDefined();
        expect(result.redo).toHaveLength(2); // insert + update
        expect(result.undo).toHaveLength(2); // delete + insert with old values
        expect(result.changedEntities.size).toBe(1);
        expect(result.changedComponents.size).toBe(1); // position
        expect(result.changedArchetypes.size).toBe(1);
    });

    it("should rollback on error", () => {
        const baseStore = createStore(
            { position: positionSchema, health: healthSchema },
            { time: { delta: 0.016, elapsed: 0 } }
        );
        
        const store = createTransactionalStore(baseStore);

        // Create initial entity in a transaction
        let entity: number = -1;
        store.execute((transactionStore) => {
            const archetype = transactionStore.ensureArchetype(["id", "position"]);
            entity = archetype.insert({ position: { x: 1, y: 2, z: 3 } });
        });

        // Verify initial state
        const initialData = store.read(entity);
        expect(initialData?.position).toEqual({ x: 1, y: 2, z: 3 });

        // Execute transaction that throws an error
        expect(() => {
            store.execute((transactionStore) => {
                // Update entity
                transactionStore.update(entity, { position: { x: 10, y: 20, z: 30 } });
                
                // This should cause rollback
                throw new Error("Transaction failed");
            });
        }).toThrow("Transaction failed");

        // Verify rollback occurred
        const finalData = store.read(entity);
        expect(finalData?.position).toEqual({ x: 1, y: 2, z: 3 });
    });

    it("should combine multiple updates to the same entity", () => {
        const baseStore = createStore(
            { position: positionSchema, health: healthSchema },
            { time: { delta: 0.016, elapsed: 0 } }
        );
        
        const store = createTransactionalStore(baseStore);

        const result = store.execute((transactionStore) => {
            const archetype = transactionStore.ensureArchetype(["id", "position", "health"]);
            const entity = archetype.insert({ 
                position: { x: 1, y: 2, z: 3 },
                health: { current: 100, max: 100 }
            });

            // Multiple updates to the same entity should be combined
            transactionStore.update(entity, { position: { x: 10, y: 20, z: 30 } });
            transactionStore.update(entity, { health: { current: 50, max: 100 } });
        });

        // Should have combined updates
        expect(result.redo).toHaveLength(2); // insert + combined update
        expect(result.undo).toHaveLength(2); // delete + insert with old values
        
        const updateOperation = result.redo.find(op => op.type === "update");
        expect(updateOperation?.type).toBe("update");
        if (updateOperation?.type === "update") {
            expect(updateOperation.values).toHaveProperty("position");
            expect(updateOperation.values).toHaveProperty("health");
        }
    });

    it("should track changed entities, components, and archetypes", () => {
        const baseStore = createStore(
            { position: positionSchema, health: healthSchema },
            { time: { delta: 0.016, elapsed: 0 } }
        );
        
        const store = createTransactionalStore(baseStore);

        const result = store.execute((transactionStore) => {
            // Create entities in different archetypes
            const posArchetype = transactionStore.ensureArchetype(["id", "position"]);
            const healthArchetype = transactionStore.ensureArchetype(["id", "health"]);
            
            const entity1 = posArchetype.insert({ position: { x: 1, y: 2, z: 3 } });
            const entity2 = healthArchetype.insert({ health: { current: 100, max: 100 } });

            // Update resources
            transactionStore.resources.time = { delta: 0.032, elapsed: 1 };
        });

        expect(result.changedEntities.size).toBe(2);
        expect(result.changedComponents.size).toBe(2); // position, health
        expect(result.changedArchetypes.size).toBe(2); // two different archetypes
    });

    it("should preserve base store functionality", () => {
        const baseStore = createStore(
            { position: positionSchema, health: healthSchema },
            { time: { delta: 0.016, elapsed: 0 } }
        );
        
        const store = createTransactionalStore(baseStore);

        // Verify all base store methods are available
        expect(store.componentSchemas).toBeDefined();
        expect(store.resources).toBeDefined();
        expect(store.queryArchetypes).toBeDefined();
        expect(store.ensureArchetype).toBeDefined();
        expect(store.locate).toBeDefined();
        expect(store.read).toBeDefined();
        expect(store.execute).toBeDefined();

        // Verify we can use the store normally for read operations
        const archetypes = store.queryArchetypes(["id"]);
        expect(archetypes.length).toBeGreaterThan(0);
        
        // Verify we can create entities through transactions
        store.execute((transactionStore) => {
            const archetype = transactionStore.ensureArchetype(["id", "position"]);
            const entity = archetype.insert({ position: { x: 1, y: 2, z: 3 } });
            expect(store.read(entity)).toBeDefined();
        });
    });
}); 