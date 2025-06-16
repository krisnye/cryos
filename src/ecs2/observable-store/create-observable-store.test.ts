import { describe, it, expect, vi, Mock } from "vitest";
import { createObservableStore } from "./create-observable-store";
import { createStore } from "../store/create-store";
import { F32Schema, FromSchema, Schema } from "data";
import { Entity } from "../entity";

// Test schemas
const positionSchema = {
    type: "object",
    properties: {
        x: F32Schema,
        y: F32Schema,
        z: F32Schema,
    }
} as const satisfies Schema;
type Position = FromSchema<typeof positionSchema>;

const healthSchema = {
    type: "object",
    properties: {
        current: F32Schema,
        max: F32Schema,
    }
} as const satisfies Schema;
type Health = FromSchema<typeof healthSchema>;

const nameSchema = {
    type: "string",
    maxLength: 50,
} as const satisfies Schema;
type Name = FromSchema<typeof nameSchema>;

function createTestObservableStore() {
    const baseStore = createStore(
        { position: positionSchema, health: healthSchema, name: nameSchema },
        { time: { delta: 0.016, elapsed: 0 } }
    );
    
    return createObservableStore(baseStore, {
        createPositionEntity(db, args: { position: { x: number, y: number, z: number } }) {
            const archetype = db.ensureArchetype(["id", "position"]);
            return archetype.insert(args);
        },
        createPositionHealthEntity(db, args: { position: { x: number, y: number, z: number }, health: { current: number, max: number } }) {
            const archetype = db.ensureArchetype(["id", "position", "health"]);
            return archetype.insert(args);
        },
        createPositionNameEntity(db, args: { position: { x: number, y: number, z: number }, name: string }) {
            const archetype = db.ensureArchetype(["id", "position", "name"]);
            return archetype.insert(args);
        },
        createFullEntity(db, args: { position: { x: number, y: number, z: number }, health: { current: number, max: number }, name: string }) {
            const archetype = db.ensureArchetype(["id", "position", "health", "name"]);
            return archetype.insert(args);
        },
        createEntityAndReturn(db, args: { position: Position, name: Name }) {
            const archetype = db.ensureArchetype(["id", "position", "name"]);
            const entity = archetype.insert(args);
            return entity;
        },
        updateEntity(db, args: { 
            entity: Entity, 
            values: Partial<{
                position: { x: number, y: number, z: number },
                health: { current: number, max: number },
                name: string
            }>
        }) {
            db.update(args.entity, args.values);
        },
        deleteEntity(db, args: { entity: Entity }) {
            db.delete(args.entity);
        },
        updateTime(db, args: { delta: number, elapsed: number }) {
            db.resources.time = args;
        }
    });
}

describe("createObservableStore", () => {
    it("should notify component observers when components change", () => {
        const store = createTestObservableStore();
        const positionObserver = vi.fn();
        const nameObserver = vi.fn();
        
        // Subscribe to component changes
        const unsubscribePosition = store.observe.component.position(positionObserver);
        const unsubscribeName = store.observe.component.name(nameObserver);

        // Create an entity that affects both components
        const testEntity = store.transactions.createFullEntity({
            position: { x: 1, y: 2, z: 3 },
            name: "Test",
            health: { current: 100, max: 100 }
        });

        // Both observers should be notified
        expect(positionObserver).toHaveBeenCalledTimes(1);
        expect(nameObserver).toHaveBeenCalledTimes(1);

        // Update only position
        store.transactions.updateEntity({
            entity: testEntity,
            values: { position: { x: 4, y: 5, z: 6 } }
        });

        // Only position observer should be notified
        expect(positionObserver).toHaveBeenCalledTimes(2);
        expect(nameObserver).toHaveBeenCalledTimes(1);

        // Unsubscribe and verify no more notifications
        unsubscribePosition();
        unsubscribeName();
        
        store.transactions.updateEntity({
            entity: testEntity,
            values: { position: { x: 7, y: 8, z: 9 }, name: "Updated" }
        });

        expect(positionObserver).toHaveBeenCalledTimes(2);
        expect(nameObserver).toHaveBeenCalledTimes(1);
    });

    it("should notify entity observers with correct values", () => {
        const store = createTestObservableStore();

        // Create initial entity
        const testEntity = store.transactions.createFullEntity({
            position: { x: 1, y: 2, z: 3 },
            name: "Test",
            health: { current: 100, max: 100 }
        });

        // Subscribe to entity changes
        const observer = vi.fn();
        const unsubscribe = store.observe.entity(testEntity)(observer);

        // Initial notification should have current values
        expect(observer).toHaveBeenCalledWith(expect.objectContaining({
            position: { x: 1, y: 2, z: 3 },
            name: "Test",
            health: { current: 100, max: 100 }
        }));

        // Update entity
        store.transactions.updateEntity({
            entity: testEntity,
            values: { name: "Updated", health: { current: 50, max: 100 } }
        });

        // Observer should be notified with new values
        expect(observer).toHaveBeenCalledWith(expect.objectContaining({
            position: { x: 1, y: 2, z: 3 }, // unchanged
            name: "Updated",
            health: { current: 50, max: 100 }
        }));

        // Delete entity
        store.transactions.deleteEntity({ entity: testEntity });

        // Observer should be notified with null
        expect(observer).toHaveBeenCalledWith(null);

        unsubscribe();
    });

    it("should notify transaction observers with full transaction results", () => {
        const store = createTestObservableStore();
        const transactionObserver = vi.fn();
        
        const unsubscribe = store.observe.transactions(transactionObserver);

        // Execute a transaction with multiple operations
        store.transactions.createFullEntity({
            position: { x: 1, y: 2, z: 3 },
            name: "Test",
            health: { current: 100, max: 100 }
        });

        // Transaction observer should be called with the full result
        expect(transactionObserver).toHaveBeenCalledWith(expect.objectContaining({
            changedEntities: expect.any(Set),
            changedComponents: expect.any(Set),
            changedArchetypes: expect.any(Set),
            redo: expect.any(Array),
            undo: expect.any(Array)
        }));

        const result = transactionObserver.mock.calls[0][0];
        expect(result.changedEntities.size).toBe(1);
        expect(result.changedComponents.has("position")).toBe(true);
        expect(result.changedComponents.has("name")).toBe(true);

        unsubscribe();
    });

    it("should notify archetype observers when entities change archetypes", () => {
        const store = createTestObservableStore();
        
        // Create initial entity
        const entity = store.transactions.createPositionEntity({
            position: { x: 1, y: 2, z: 3 }
        });

        const archetype = store.locate(entity)?.archetype;
        expect(archetype).toBeDefined();

        const archetypeObserver = vi.fn();
        const unsubscribe = store.observe.archetype(archetype!)(archetypeObserver);

        // No initial notification for archetype observers
        expect(archetypeObserver).toHaveBeenCalledTimes(0);

        // Update entity to add name component, potentially changing archetype
        store.transactions.updateEntity({
            entity,
            values: { name: "Test" }
        });

        // Archetype observer should be notified of the change
        expect(archetypeObserver).toHaveBeenCalledTimes(1);

        unsubscribe();
    });

    it("should notify resource observers with immediate and update notifications", () => {
        const store = createTestObservableStore();

        const timeObserver = vi.fn();

        // Subscribe to resource changes
        const unsubscribeTime = store.observe.resource.time(timeObserver);

        // Observer should be notified immediately with initial value
        expect(timeObserver).toHaveBeenCalledWith({ delta: 0.016, elapsed: 0 });

        debugger;
        // Update time resource
        store.transactions.updateTime({ delta: 0.032, elapsed: 1 });

        // Observer should be notified with new value
        expect(timeObserver).toHaveBeenCalledWith({ delta: 0.032, elapsed: 1 });

        // // Unsubscribe and verify no more notifications
        // unsubscribeTime();

        // store.transactions.updateTime({ delta: 0.048, elapsed: 2 });

        // expect(timeObserver).toHaveBeenCalledTimes(2); // No more calls after unsubscribe
    });

    it("should support multiple observers for the same target", () => {
        const store = createTestObservableStore();
        
        const observer1 = vi.fn();
        const observer2 = vi.fn();
        const observer3 = vi.fn();

        // Subscribe multiple observers to the same component
        const unsubscribe1 = store.observe.component.position(observer1);
        const unsubscribe2 = store.observe.component.position(observer2);
        const unsubscribe3 = store.observe.component.position(observer3);

        // Create entity with position
        const entity = store.transactions.createPositionEntity({
            position: { x: 1, y: 2, z: 3 }
        });

        // All observers should be notified
        expect(observer1).toHaveBeenCalledTimes(1);
        expect(observer2).toHaveBeenCalledTimes(1);
        expect(observer3).toHaveBeenCalledTimes(1);

        // Unsubscribe one observer
        unsubscribe2();

        // Update position
        store.transactions.updateEntity({
            entity,
            values: { position: { x: 4, y: 5, z: 6 } }
        });

        // Only remaining observers should be notified
        expect(observer1).toHaveBeenCalledTimes(2);
        expect(observer2).toHaveBeenCalledTimes(1); // No more calls
        expect(observer3).toHaveBeenCalledTimes(2);

        unsubscribe1();
        unsubscribe3();
    });

    it("should handle observer cleanup correctly", () => {
        const store = createTestObservableStore();
        
        const observer = vi.fn();
        const unsubscribe = store.observe.component.position(observer);

        // Create entity
        const entity = store.transactions.createPositionEntity({
            position: { x: 1, y: 2, z: 3 }
        });

        expect(observer).toHaveBeenCalledTimes(1);

        // Unsubscribe
        unsubscribe();

        // Update entity
        store.transactions.updateEntity({
            entity,
            values: { position: { x: 4, y: 5, z: 6 } }
        });

        // Observer should not be called after unsubscribe
        expect(observer).toHaveBeenCalledTimes(1);
    });

    it("should handle observing non-existent entities", () => {
        const store = createTestObservableStore();
        
        const observer = vi.fn();
        const unsubscribe = store.observe.entity(999 as Entity)(observer);

        // Should be notified with null for non-existent entity
        expect(observer).toHaveBeenCalledWith(null);

        unsubscribe();
    });

    it("should handle complex transaction scenarios with multiple observers", () => {
        const store = createTestObservableStore();
        
        const positionObserver = vi.fn();
        const healthObserver = vi.fn();
        const transactionObserver = vi.fn();
        const entityObserver = vi.fn();

        // Subscribe to various observers
        const unsubscribePosition = store.observe.component.position(positionObserver);
        const unsubscribeHealth = store.observe.component.health(healthObserver);
        const unsubscribeTransaction = store.observe.transactions(transactionObserver);

        // Create entity
        const entity = store.transactions.createPositionHealthEntity({
            position: { x: 1, y: 2, z: 3 },
            health: { current: 100, max: 100 }
        });

        const unsubscribeEntity = store.observe.entity(entity)(entityObserver);

        // All observers should be notified
        expect(positionObserver).toHaveBeenCalledTimes(1);
        expect(healthObserver).toHaveBeenCalledTimes(1);
        expect(transactionObserver).toHaveBeenCalledTimes(1);
        expect(entityObserver).toHaveBeenCalledTimes(1);

        // Update multiple components
        store.transactions.updateEntity({
            entity,
            values: { 
                position: { x: 4, y: 5, z: 6 },
                health: { current: 50, max: 100 }
            }
        });

        // All observers should be notified again
        expect(positionObserver).toHaveBeenCalledTimes(2);
        expect(healthObserver).toHaveBeenCalledTimes(2);
        expect(transactionObserver).toHaveBeenCalledTimes(2);
        expect(entityObserver).toHaveBeenCalledTimes(2);

        // Verify entity observer received correct values
        expect(entityObserver).toHaveBeenCalledWith(expect.objectContaining({
            position: { x: 4, y: 5, z: 6 },
            health: { current: 50, max: 100 }
        }));

        unsubscribePosition();
        unsubscribeHealth();
        unsubscribeTransaction();
        unsubscribeEntity();
    });

    it("should handle rapid successive changes efficiently", () => {
        const store = createTestObservableStore();
        
        const observer = vi.fn();
        const unsubscribe = store.observe.component.position(observer);

        // Create entity
        const entity = store.transactions.createPositionEntity({
            position: { x: 1, y: 2, z: 3 }
        });

        // Make rapid successive updates
        for (let i = 0; i < 5; i++) {
            store.transactions.updateEntity({
                entity,
                values: { position: { x: i, y: i, z: i } }
            });
        }

        // Observer should be called for each change
        expect(observer).toHaveBeenCalledTimes(6); // 1 for create + 5 for updates

        unsubscribe();
    });

    it("should support transaction functions that return an Entity", () => {
        const store = createTestObservableStore();
        
        // Execute a transaction that returns an Entity
        const returnedEntity = store.transactions.createEntityAndReturn({
            position: { x: 10, y: 20, z: 30 },
            name: "ReturnedEntity"
        });

        // Verify that an Entity was returned
        expect(returnedEntity).toBeDefined();
        expect(typeof returnedEntity).toBe("number");

        // Verify the entity exists in the store
        const entityValues = store.read(returnedEntity);
        expect(entityValues).toBeDefined();
        expect(entityValues?.position).toEqual({ x: 10, y: 20, z: 30 });
        expect(entityValues?.name).toBe("ReturnedEntity");

        // Verify the entity can be found in the store using select
        const selectedEntities = store.select(["id", "position", "name"]);
        expect(selectedEntities).toContain(returnedEntity);
    });
}); 