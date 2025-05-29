import { describe, it, expect, vi, Mock } from "vitest";
import { createDatabase, Database } from "ecs/database";
import { F32Schema, FromSchema, Schema, U32Schema } from "data";
import { Entity } from "ecs/entity";
import { ObservableDatabase } from "./observable-datatabase";
import { createObservableDatabase } from "./create-observable-database";

const Vec3Schema = {
    type: 'array',
    items: F32Schema,
    minItems: 3,
    maxItems: 3,
    default: [0, 0, 0] as [number, number, number],
} as const satisfies Schema;
type Vec3 = FromSchema<typeof Vec3Schema>;

type TestComponents = {
    id: number;
    position: [number, number, number];
    velocity: [number, number, number];
    name: string;
    age: number;
};

type TestArchetypes = {
    [K in "particle" | "particleWithoutName"]: K extends "particle" 
        ? ["id", "position", "name", "velocity", "age"]
        : ["id", "position", "velocity", "age"];
} & { [K: string]: ["id"] };

const testSchemas = {
    position: Vec3Schema,
    velocity: Vec3Schema,
    name: {
        type: "string",
    } as const satisfies Schema,
    age: U32Schema,
} as const;

function createTestObservableDatabase() {
    return createDatabase()
        .withComponents(testSchemas)
        .withArchetypes({
            particle: ["id", "position", "name", "velocity", "age"],
            particleWithoutName: ["id", "position", "velocity", "age"],
        } as const).toObservable();
}

describe("createObservableDatabase", () => {
    it("should notify component observers when components change", () => {
        const db = createTestObservableDatabase();
        const positionObserver = vi.fn();
        const nameObserver = vi.fn();
        
        // Subscribe to component changes
        const unsubscribePosition = db.observe.component.position(positionObserver);
        const unsubscribeName = db.observe.component.name(nameObserver);

        // Create an entity that affects both components
        let testEntity!: Entity;
        db.execute((db) => {
            testEntity = db.archetypes.particle.create({
                position: [1, 2, 3],
                name: "Test",
                velocity: [0, 0, 0],
                age: 0
            });
        });

        // Both observers should be notified
        expect(positionObserver).toHaveBeenCalledTimes(1);
        expect(nameObserver).toHaveBeenCalledTimes(1);

        // Update only position
        db.execute((db) => {
            db.updateEntity(testEntity, { position: [4, 5, 6] });
        });

        // Only position observer should be notified
        expect(positionObserver).toHaveBeenCalledTimes(2);
        expect(nameObserver).toHaveBeenCalledTimes(1);

        // Unsubscribe and verify no more notifications
        unsubscribePosition();
        unsubscribeName();
        
        db.execute((db) => {
            db.updateEntity(testEntity, { position: [7, 8, 9], name: "Updated" });
        });

        expect(positionObserver).toHaveBeenCalledTimes(2);
        expect(nameObserver).toHaveBeenCalledTimes(1);
    });

    it("should notify entity observers with correct values", () => {
        const db = createTestObservableDatabase();
        const entityObservers = new Map<Entity, Mock>();
        let testEntity!: Entity;

        // Create initial entity
        db.execute((db) => {
            testEntity = db.archetypes.particle.create({
                position: [1, 2, 3],
                name: "Test",
                velocity: [0, 0, 0],
                age: 0
            });
        });

        // Subscribe to entity changes
        const observer = vi.fn();
        const unsubscribe = db.observe.entity(testEntity)(observer);
        entityObservers.set(testEntity, observer);

        // Initial notification should have current values
        expect(observer).toHaveBeenCalledWith(expect.objectContaining({
            position: [1, 2, 3],
            name: "Test",
            velocity: [0, 0, 0],
            age: 0
        }));

        // Update entity
        db.execute((db) => {
            db.updateEntity(testEntity, {
                name: "Updated",
                age: 25
            });
        });

        // Observer should be notified with new values
        expect(observer).toHaveBeenCalledWith(expect.objectContaining({
            position: [1, 2, 3], // unchanged
            name: "Updated",
            velocity: [0, 0, 0], // unchanged
            age: 25
        }));

        // Delete entity
        db.execute((db) => {
            db.deleteEntity(testEntity);
        });

        // Observer should be notified with null
        expect(observer).toHaveBeenCalledWith(null);

        unsubscribe();
    });

    it("should notify transaction observers with full transaction results", () => {
        const db = createTestObservableDatabase();
        const transactionObserver = vi.fn();
        
        const unsubscribe = db.observe.transactions(transactionObserver);

        // Execute a transaction with multiple operations
        const result = db.execute((db) => {
            const entity = db.archetypes.particle.create({
                position: [1, 2, 3],
                name: "Test",
                velocity: [0, 0, 0],
                age: 0
            });
            db.updateEntity(entity, { name: "Updated" });
        });

        // Transaction observer should be called with the full result
        expect(transactionObserver).toHaveBeenCalledWith(result);
        expect(result.changedEntities.size).toBe(1);
        expect(result.changedComponents.has("name")).toBe(true);
        expect(result.changedComponents.has("position")).toBe(true);
        expect(result.redo).toHaveLength(2); // create + update
        expect(result.undo).toHaveLength(2); // delete + update

        unsubscribe();
    });

    it("should notify archetype observers when entities change archetypes", () => {
        const db = createTestObservableDatabase();
        const particleObserver = vi.fn();
        const particleWithoutNameObserver = vi.fn();
        
        // Subscribe to archetype changes
        const unsubscribeParticle = db.observe.archetype(db.archetypes.particle.id)(particleObserver);
        const unsubscribeWithoutName = db.observe.archetype(db.archetypes.particleWithoutName.id)(particleWithoutNameObserver);

        // Create entity in particleWithoutName archetype
        let entity!: Entity;
        db.execute((db) => {
            entity = db.archetypes.particleWithoutName.create({
                position: [1, 2, 3],
                velocity: [0, 0, 0],
                age: 0
            });
        });

        // Only particleWithoutName observer should be notified
        expect(particleWithoutNameObserver).toHaveBeenCalledTimes(1);
        expect(particleObserver).toHaveBeenCalledTimes(0);

        // Update entity to add name component, changing archetype
        db.execute((db) => {
            db.updateEntity(entity, { name: "Test" });
        });

        // Both observers should be notified of archetype change
        expect(particleWithoutNameObserver).toHaveBeenCalledTimes(2);
        expect(particleObserver).toHaveBeenCalledTimes(1);

        unsubscribeParticle();
        unsubscribeWithoutName();
    });

    it("should notify resource observers with immediate and update notifications", () => {
        const db = createDatabase()
            .withComponents(testSchemas)
            .withArchetypes({
                particle: ["id", "position", "name", "velocity", "age"],
                particleWithoutName: ["id", "position", "velocity", "age"],
            })
            .withResources({
                gravity: 9.8,
                maxSpeed: 100
            })
            .toObservable();

        const gravityObserver = vi.fn();
        const maxSpeedObserver = vi.fn();

        // Subscribe to resource changes
        const unsubscribeGravity = db.observe.resource.gravity(gravityObserver);
        const unsubscribeMaxSpeed = db.observe.resource.maxSpeed(maxSpeedObserver);

        // Both observers should be notified immediately with initial values
        expect(gravityObserver).toHaveBeenCalledWith(9.8);
        expect(maxSpeedObserver).toHaveBeenCalledWith(100);

        // Update gravity resource
        db.execute((db) => {
            db.resources.gravity = 10.0;
        });

        // Only gravity observer should be notified
        expect(gravityObserver).toHaveBeenCalledWith(10.0);
        expect(maxSpeedObserver).toHaveBeenCalledTimes(1); // Still only the initial call

        // Update maxSpeed resource
        db.execute((db) => {
            db.resources.maxSpeed = 150;
        });

        // Only maxSpeed observer should be notified
        expect(maxSpeedObserver).toHaveBeenCalledWith(150);
        expect(gravityObserver).toHaveBeenCalledTimes(2); // Initial + one update

        // Unsubscribe and verify no more notifications
        unsubscribeGravity();
        unsubscribeMaxSpeed();

        db.execute((db) => {
            db.resources.gravity = 11.0;
            db.resources.maxSpeed = 200;
        });

        expect(gravityObserver).toHaveBeenCalledTimes(2); // No more calls after unsubscribe
        expect(maxSpeedObserver).toHaveBeenCalledTimes(2); // No more calls after unsubscribe
    });

    it("should support transactions and notify observers", () => {
        const db = createTestObservableDatabase().withTransactions({
            createParticle(db, args: { position: Vec3, name: string, velocity: Vec3, age: number }) {
                db.archetypes.particle.create(args);
            },
            moveParticle(db, { entity, time }: { entity: Entity, time: number }) {
                const entityValues = db.selectEntity(entity);
                if (entityValues) {
                    const position = entityValues.position;
                    const velocity = entityValues.velocity;
                    if (position && velocity) {
                        const newPosition: Vec3 = [
                            position[0] + velocity[0] * time,
                            position[1] + velocity[1] * time,
                            position[2] + velocity[2] * time
                        ];
                        db.updateEntity(entity, { position: newPosition });
                    }
                }
            }
        });

        // Set up observers
        const positionObserver = vi.fn();
        const transactionObserver = vi.fn();
        
        const unsubscribePosition = db.observe.component.position(positionObserver);
        const unsubscribeTransaction = db.observe.transactions(transactionObserver);

        // Execute a transaction
        db.transactions.createParticle({
            position: [1, 2, 3],
            name: "Test Particle",
            velocity: [1, 1, 1],
            age: 0
        });

        // Verify observers were notified of creation
        expect(positionObserver).toHaveBeenCalledTimes(1);
        expect(transactionObserver).toHaveBeenCalledTimes(1);
        expect(transactionObserver.mock.calls[0][0].changedComponents.has("position")).toBe(true);
        expect(transactionObserver.mock.calls[0][0].changedEntities.size).toBe(1);

        const entity = db.archetypes.particle.columns.id.get(0);
        // Execute another transaction
        db.transactions.moveParticle({ entity, time: 2 });

        // Verify observers were notified of movement
        expect(positionObserver).toHaveBeenCalledTimes(2);
        expect(transactionObserver).toHaveBeenCalledTimes(2);
        expect(transactionObserver.mock.calls[1][0].changedComponents.has("position")).toBe(true);
        expect(transactionObserver.mock.calls[1][0].changedEntities.size).toBe(1);

        // Verify the final state
        expect(db.selectEntity(entity)?.position).toEqual([3, 4, 5]); // [1,2,3] + [1,1,1] * 2

        unsubscribePosition();
        unsubscribeTransaction();
    });

    it("should support computed resources immediately and observed", () => {
        const db = createDatabase().withResources({
            gravity: 9.8,
            gravityMultiplier: 100,
        }).toObservable()
        .withComputedResource("effectiveGravity", ["gravity", "gravityMultiplier"], ({gravity, gravityMultiplier}) => gravity * gravityMultiplier);

        expect(db.resources.effectiveGravity).toBeCloseTo(9.8 * 100);

        db.execute(db => db.resources.gravity = 10.0);

        expect(db.resources.effectiveGravity).toBeCloseTo(10.0 * 100);

        // now check observers
        const effectiveGravityObserver = vi.fn();
        const unsubscribeEffectiveGravity = db.observe.resource.effectiveGravity(effectiveGravityObserver);

        expect(effectiveGravityObserver).toHaveBeenCalledWith(10.0 * 100);

        db.execute(db => db.resources.gravity = 11.0);

        expect(effectiveGravityObserver).toHaveBeenCalledWith(11.0 * 100);

        unsubscribeEffectiveGravity();        
        
    });
}); 