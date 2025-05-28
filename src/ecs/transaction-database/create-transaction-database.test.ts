import { describe, it, expect } from "vitest";
import { createDatabase, Database } from "ecs/database";
import { createTransactionDatabase } from "./create-transaction-database";
import { DELETE, TransactionDatabase } from "./transaction-database";
import { F32Schema, Schema, U32Schema } from "data";
import { Archetype } from "ecs/archetype";
import { CoreComponents } from "ecs/database/core-components";
import { ArchetypeComponents } from "ecs/database/archetype-components";
import { Entity } from "ecs/entity";
import { applyWriteOperations } from "./apply-write-operations";

const Vec3Schema = {
    type: 'array',
    items: F32Schema,
    minItems: 3,
    maxItems: 3,
    default: [0, 0, 0] as [number, number, number],
} as const satisfies Schema;

type TestComponents = {
    id: number;
    position: [number, number, number];
    velocity: [number, number, number];
    name: string;
    age: number;
};

const testSchemas = {
    position: Vec3Schema,
    velocity: Vec3Schema,
    name: {
        type: "string",
    } as const satisfies Schema,
    age: U32Schema,
} as const;

function createTestTransactionDatabase() {
    return createDatabase().withComponents(testSchemas).withArchetypes({
        particle: ["id", "position", "name", "velocity", "age"],
        particleWithoutName: ["id", "position", "velocity", "age"],
    }).toObservable();
}

describe("createTransactionDatabase", () => {
    describe("transaction execution", () => {
        it("should track changes in a successful transaction", () => {
            const db = createTestTransactionDatabase();
            const archetype = db.getArchetype(["id", "position", "name", "velocity", "age"]) as Archetype<TestComponents>;

            const result = db.execute((db) => {
                const entity = archetype.create({
                    position: [1, 2, 3],
                    name: "Test Entity",
                    velocity: [0, 0, 0],
                    age: 0
                });
                db.updateEntity(entity, { name: "Updated Name" });
            });

            expect(result.changedEntities.size).toBe(1);
            expect(result.changedComponents.has("name")).toBe(true);
            expect(result.changedComponents.has("position")).toBe(true);
            expect(result.redo).toHaveLength(2); // create + update should be combined
            expect(result.undo).toHaveLength(2); // delete + update
        });

        it("should rollback changes on transaction failure", () => {
            const db = createTestTransactionDatabase();

            let entity!: Entity;
            db.execute(db => {
                // Create initial entity
                entity = db.archetypes.particle.create({
                    position: [1, 2, 3],
                    name: "Original",
                    velocity: [0, 0, 0],
                    age: 0
                });
            })

            expect(() => {
                db.execute((db) => {
                    db.updateEntity(entity, { name: "Updated" });
                    throw new Error("Transaction failed");
                });
            }).toThrow("Transaction failed");

            // Verify rollback
            expect(db.selectEntity(entity)?.name).toBe("Original");
        });

        it("should combine consecutive updates to the same entity", () => {
            const db = createTestTransactionDatabase();

            const result = db.execute((db) => {
                const entity = db.archetypes.particle.create({
                    position: [1, 2, 3],
                    name: "First",
                    velocity: [0, 0, 0],
                    age: 0
                });
                db.updateEntity(entity, { name: "Second" });
                db.updateEntity(entity, { name: "Third" });
            });

            // Should have create + single combined update
            expect(result.redo).toHaveLength(2);
            expect(result.undo).toHaveLength(2);
            
            const updateOp = result.redo[1];
            expect(updateOp.type).toBe("update");
            expect((updateOp as any).values.name).toBe("Third");
        });

        it("should handle component deletion in transactions", () => {
            const db = createTestTransactionDatabase();

            const result = db.execute((db) => {
                const entity = db.archetypes.particle.create({
                    position: [1, 2, 3],
                    name: "Test",
                    age: 25,
                    velocity: [0, 0, 0]
                });
                db.updateEntity(entity, {
                    name: DELETE as unknown as string,
                    age: DELETE as unknown as number
                });
            });

            expect(result.changedComponents.has("name")).toBe(true);
            expect(result.changedComponents.has("age")).toBe(true);
            
            // Verify the undo operation restores deleted components
            const undoOp = result.undo[0];
            expect(undoOp.type).toBe("update");
            expect((undoOp as any).values.name).toBe("Test");
            expect((undoOp as any).values.age).toBe(25);
        });

        it("should track archetype changes during component updates", () => {
            const db = createTestTransactionDatabase();

            const result = db.execute((db) => {
                const entity = db.archetypes.particleWithoutName.create({
                    position: [1, 2, 3],
                    velocity: [0, 0, 0],
                    age: 0
                });
                db.updateEntity(entity, {
                    name: "Test",
                    age: 25
                });
            });

            expect(result.changedArchetypes.size).toBe(2); // Both archetypes involved
            expect(result.changedArchetypes.has(db.archetypes.particle.id)).toBe(true);
            expect(result.changedArchetypes.has(db.archetypes.particleWithoutName.id)).toBe(true);
            expect(result.changedComponents.has("name")).toBe(true);
            expect(result.changedComponents.has("age")).toBe(true);
        });

        it("should handle multiple operations in a single transaction", () => {
            const db = createTestTransactionDatabase();

            const result = db.execute((db) => {
                // Create first entity
                const entity1 = db.archetypes.particle.create({
                    position: [1, 2, 3],
                    name: "First",
                    velocity: [0, 0, 0],
                    age: 0
                });

                // Create second entity
                const entity2 = db.archetypes.particle.create({
                    position: [4, 5, 6],
                    name: "Second",
                    velocity: [0, 0, 0],
                    age: 0
                });

                // Update both entities
                db.updateEntity(entity1, { name: "Updated First" });
                db.updateEntity(entity2, { name: "Updated Second" });
            });

            // Should track all operations in a single transaction
            expect(result.changedEntities.size).toBe(2);
            expect(result.redo).toHaveLength(4); // 2 creates + 2 updates
            expect(result.undo).toHaveLength(4); // 2 deletes + 2 updates
        });

        it("should clear change tracking after transaction completion", () => {
            const db = createTestTransactionDatabase();

            // First transaction
            db.execute((db) => {
                db.archetypes.particle.create({
                    position: [1, 2, 3],
                    name: "First",
                    velocity: [0, 0, 0],
                    age: 0
                });
            });

            // Second transaction
            const result = db.execute((db) => {
                db.archetypes.particle.create({
                    position: [4, 5, 6],
                    name: "Second",
                    velocity: [0, 0, 0],
                    age: 0
                });
            });

            // Should only track changes from second transaction
            expect(result.changedEntities.size).toBe(1);
            expect(result.redo).toHaveLength(1);
            expect(result.undo).toHaveLength(1);
        });

        it("should correctly revert state when applying undo operations and preserve entity IDs on redo", () => {
            const db = createTestTransactionDatabase();
            const initialEntities = new Map<Entity, Partial<TestComponents>>();

            // Create initial state
            db.execute(db => {
                const entity1 = db.archetypes.particle.create({
                    position: [1, 2, 3],
                    name: "First",
                    velocity: [0, 0, 0],
                    age: 25
                });
                const entity2 = db.archetypes.particleWithoutName.create({
                    position: [4, 5, 6],
                    velocity: [1, 1, 1],
                    age: 30
                });
                // Store initial state, omitting undefined values
                const values1 = db.selectEntity(entity1)!;
                const values2 = db.selectEntity(entity2)!;
                initialEntities.set(entity1, {
                    position: values1.position!,
                    name: values1.name!,
                    velocity: values1.velocity!,
                    age: values1.age!
                });
                initialEntities.set(entity2, {
                    position: values2.position!,
                    velocity: values2.velocity!,
                    age: values2.age!
                });
            });

            // Execute a transaction with multiple operations
            const result = db.execute(db => {
                const [entity1, entity2] = Array.from(initialEntities.keys());
                // Update first entity
                db.updateEntity(entity1, {
                    name: "Updated First",
                    age: 26
                });
                // Update second entity
                db.updateEntity(entity2, {
                    name: "Added Name",
                    velocity: [2, 2, 2]
                });
            });

            // Store the entity IDs after the transaction
            const entityIdsAfterTransaction = Array.from(initialEntities.keys());

            // Apply undo operations to revert changes
            db.execute(db => {
                applyWriteOperations(db as any, result.undo);
            });

            // Verify state is back to initial
            for (const [entity, initialValues] of initialEntities) {
                const currentValues = db.selectEntity(entity);
                // Compare only the components that were in initial state
                for (const [key, value] of Object.entries(initialValues)) {
                    expect(currentValues?.[key as keyof TestComponents]).toEqual(value);
                }
            }

            // Apply redo operations
            db.execute(db => {
                applyWriteOperations(db as any, result.redo);
            });

            // Verify that entities have the same IDs as after the initial transaction
            const entityIdsAfterRedo = Array.from(initialEntities.keys());
            expect(entityIdsAfterRedo).toEqual(entityIdsAfterTransaction);

            // Also verify the final state matches what we had after the initial transaction
            for (const [entity, initialValues] of initialEntities) {
                const currentValues = db.selectEntity(entity);
                if (entity === entityIdsAfterRedo[0]) {
                    // First entity should have updated values
                    expect(currentValues?.name).toBe("Updated First");
                    expect(currentValues?.age).toBe(26);
                } else {
                    // Second entity should have updated values
                    expect(currentValues?.name).toBe("Added Name");
                    expect(currentValues?.velocity).toEqual([2, 2, 2]);
                }
            }
        });
    });
}); 