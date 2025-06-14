import { describe, it, expect, vi, Mock } from "vitest";
import { createDatastore } from "ecs/datastore";
import { F32Schema, FromSchema, Schema, U32Schema } from "data";
import { Entity } from "ecs/entity";
import { createDatabase } from "./create-database";

const Vec3Schema = {
    type: 'array',
    items: F32Schema,
    minItems: 3,
    maxItems: 3,
    default: [0, 0, 0] as [number, number, number],
} as const satisfies Schema;
type Vec3 = FromSchema<typeof Vec3Schema>;

const testSchemas = {
    position: Vec3Schema,
    velocity: Vec3Schema,
    name: {
        type: "string",
    } as const satisfies Schema,
    age: U32Schema,
} as const;

function createTestDatabase() {
    return createDatastore()
        .withComponents(testSchemas)
        .withArchetypes({
            particle: ["id", "position", "name", "velocity", "age"],
            particleWithoutName: ["id", "position", "velocity", "age"],
        } as const).toDatabase();
}

describe("createObservableDatabase", () => {
    it("should notify component observers when components change", () => {
        const db = createTestDatabase();
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
        const db = createTestDatabase();
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
        const db = createTestDatabase();
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
        const db = createTestDatabase();
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
        const db = createDatastore()
            .withComponents(testSchemas)
            .withArchetypes({
                particle: ["id", "position", "name", "velocity", "age"],
                particleWithoutName: ["id", "position", "velocity", "age"],
            })
            .withResources({
                gravity: 9.8,
                maxSpeed: 100
            })
            .toDatabase();

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
        const db = createTestDatabase().withTransactions({
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
        const db = createDatastore().withResources({
            gravity: 9.8,
            gravityMultiplier: 100,
        }).toDatabase()
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

    describe("Systems", () => {
        it("should run systems in correct phase order", () => {
            const executionOrder: string[] = [];
            
            const db = createTestDatabase().withSystems(
                {
                    name: "render",
                    phase: "render",
                    run: () => {
                        executionOrder.push("render");
                    }
                },
                {
                    name: "input",
                    phase: "input",
                    run: () => {
                        executionOrder.push("input");
                    }
                },
                {
                    name: "update",
                    phase: "update",
                    run: () => {
                        executionOrder.push("update");
                    }
                }
            );

            db.systems.run();

            expect(executionOrder).toEqual(["input", "update", "render"]);
        });

        it("should run systems with dependencies in correct order within phase", () => {
            const executionOrder: string[] = [];
            
            const db = createTestDatabase().withSystems(
                {
                    name: "physicsIntegration",
                    phase: "physics",
                    run: () => {
                        executionOrder.push("physicsIntegration");
                    }
                },
                {
                    name: "collisionDetection",
                    phase: "physics",
                    before: ["physicsIntegration"],
                    run: () => {
                        executionOrder.push("collisionDetection");
                    }
                },
            );

            db.systems.run();

            expect(executionOrder).toEqual(["collisionDetection", "physicsIntegration"]);
        });

        it("should handle async systems and wait for completion", async () => {
            const executionOrder: string[] = [];
            const system1EndTime = { value: 0 };
            const system2StartTime = { value: 0 };
            
            const db = createTestDatabase().withSystems(
                {
                    name: "asyncSystem1",
                    phase: "update",
                    run: async () => {
                        executionOrder.push("asyncSystem1-start");
                        await new Promise(resolve => setTimeout(resolve, 10));
                        executionOrder.push("asyncSystem1-end");
                        system1EndTime.value = Date.now();
                    }
                },
                {
                    name: "asyncSystem2",
                    phase: "update",
                    run: async () => {
                        system2StartTime.value = Date.now();
                        executionOrder.push("asyncSystem2-start");
                        await new Promise(resolve => setTimeout(resolve, 5));
                        executionOrder.push("asyncSystem2-end");
                    }
                }
            );

            await db.systems.run();

            expect(executionOrder).toEqual([
                "asyncSystem1-start",
                "asyncSystem1-end",
                "asyncSystem2-start",
                "asyncSystem2-end"
            ]);
            expect(system2StartTime.value).toBeGreaterThanOrEqual(system1EndTime.value);
        });

        it("should run only specified phases", () => {
            const executionOrder: string[] = [];
            
            const db = createTestDatabase().withSystems(
                {
                    name: "input",
                    phase: "input",
                    run: () => {
                        executionOrder.push("input");
                    }
                },
                {
                    name: "update",
                    phase: "update",
                    run: () => {
                        executionOrder.push("update");
                    }
                },
                {
                    name: "render",
                    phase: "render",
                    run: () => {
                        executionOrder.push("render");
                    }
                }
            );

            db.systems.run(["input", "render"]);

            expect(executionOrder).toEqual(["input", "render"]);
        });

        it("should handle mixed sync and async systems correctly", async () => {
            const executionOrder: string[] = [];
            
            const db = createTestDatabase().withSystems(
                {
                    name: "syncSystem",
                    phase: "update",
                    run: () => {
                        executionOrder.push("syncSystem");
                    }
                },
                {
                    name: "asyncSystem",
                    phase: "update",
                    run: async () => {
                        executionOrder.push("asyncSystem-start");
                        await new Promise(resolve => setTimeout(resolve, 10));
                        executionOrder.push("asyncSystem-end");
                    }
                }
            );

            await db.systems.run();

            expect(executionOrder).toEqual([
                "syncSystem",
                "asyncSystem-start",
                "asyncSystem-end"
            ]);
        });

        it("should support custom phases", () => {
            const executionOrder: string[] = [];
            
            const db = createTestDatabase()
                .withPhases(["custom1", "custom2", "custom3"] as const)
                .withSystems(
                    {
                        name: "system1",
                        phase: "custom1",
                        run: () => {
                            executionOrder.push("system1");
                        }
                    },
                    {
                        name: "system2",
                        phase: "custom2",
                        run: () => {
                            executionOrder.push("system2");
                        }
                    },
                    {
                        name: "system3",
                        phase: "custom3",
                        run: () => {
                            executionOrder.push("system3");
                        }
                    }
                );

            db.systems.run();

            expect(executionOrder).toEqual(["system1", "system2", "system3"]);
        });

        it("should allow individual system execution", async () => {
            const system1Run = vi.fn();
            const system2Run = vi.fn();
            
            const db = createTestDatabase().withSystems(
                {
                    name: "system1",
                    phase: "update",
                    run: system1Run
                },
                {
                    name: "system2",
                    phase: "update",
                    run: system2Run
                }
            );

            // Run individual systems
            db.systems.system1.run();
            await db.systems.system2.run();

            expect(system1Run).toHaveBeenCalledTimes(1);
            expect(system2Run).toHaveBeenCalledTimes(1);
        });

        it("should handle complex dependency chains", () => {
            const executionOrder: string[] = [];
            
            const db = createTestDatabase().withSystems(
                {
                    name: "A",
                    phase: "update",
                    run: () => {
                        executionOrder.push("A");
                    }
                },
                {
                    name: "B",
                    phase: "update",
                    after: ["A"],
                    run: () => {
                        executionOrder.push("B");
                    }
                },
                {
                    name: "C",
                    phase: "update",
                    after: ["A"],
                    run: () => {
                        executionOrder.push("C");
                    }
                },
                {
                    name: "D",
                    phase: "update",
                    after: ["B", "C"],
                    run: () => {
                        executionOrder.push("D");
                    }
                }
            );

            db.systems.run();

            // A must run first, D must run last, B and C can run in either order after A
            expect(executionOrder[0]).toBe("A");
            expect(executionOrder[3]).toBe("D");
            expect(executionOrder).toContain("B");
            expect(executionOrder).toContain("C");
        });

        it("should handle async systems with dependencies", async () => {
            const executionOrder: string[] = [];
            
            const db = createTestDatabase().withSystems(
                {
                    name: "asyncA",
                    phase: "update",
                    run: async () => {
                        executionOrder.push("asyncA-start");
                        await new Promise(resolve => setTimeout(resolve, 10));
                        executionOrder.push("asyncA-end");
                    }
                },
                {
                    name: "asyncB",
                    phase: "update",
                    after: ["asyncA"],
                    run: async () => {
                        executionOrder.push("asyncB-start");
                        await new Promise(resolve => setTimeout(resolve, 5));
                        executionOrder.push("asyncB-end");
                    }
                }
            );

            await db.systems.run();

            expect(executionOrder).toEqual([
                "asyncA-start",
                "asyncA-end",
                "asyncB-start",
                "asyncB-end"
            ]);
        });

        it("should provide access to phases", () => {
            const db = createTestDatabase().withSystems(
                {
                    name: "test",
                    phase: "input",
                    run: () => {}
                }
            );

            expect(db.systems.phases).toEqual([
                "input", "preUpdate", "update", "prePhysics", "physics", 
                "postPhysics", "postUpdate", "preRender", "render", "postRender"
            ]);
        });

        it("should handle empty phases gracefully", () => {
            const db = createTestDatabase();

            // Should not throw when running with no systems
            expect(() => db.systems.run()).not.toThrow();
        });

        it("should handle systems in different phases with dependencies", () => {
            const executionOrder: string[] = [];
            
            const db = createTestDatabase().withSystems(
                {
                    name: "inputSystem",
                    phase: "input",
                    run: () => {
                        executionOrder.push("input");
                    }
                },
                {
                    name: "updateSystem",
                    phase: "update",
                    run: () => {
                        executionOrder.push("update");
                    }
                },
                {
                    name: "renderSystem",
                    phase: "render",
                    run: () => {
                        executionOrder.push("render");
                    }
                }
            );

            db.systems.run();

            // Systems should run in phase order regardless of dependencies
            expect(executionOrder).toEqual(["input", "update", "render"]);
        });
    });
});
