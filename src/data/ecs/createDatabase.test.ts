import { describe, it, expect } from "vitest";
import { createDatabase } from "./createDatabase";
import { Schema } from "../Schema";
import { Vec3Schema } from "../Vec3/Vec3";
import { U32Schema } from "../U32";

// Test component schemas
const testSchemas = {
    position: Vec3Schema,
    velocity: Vec3Schema,
    name: {
        type: "string"
    } as const satisfies Schema,
    age: U32Schema,
} as const;

// Helper to create a test database with standard test components
function createTestDatabase() {
    const db = createDatabase();
    return db.withComponents(testSchemas);
}

describe("createDatabase", () => {
    describe("withComponents", () => {
        it("should merge new component schemas into database schemas", () => {
            const db = createDatabase();
            const newComponents = {
                position: { type: "object", properties: { x: { type: "number" }, y: { type: "number" } } } as const satisfies Schema,
                velocity: { type: "object", properties: { vx: { type: "number" }, vy: { type: "number" } } } as const satisfies Schema,
            };
            
            const extendedDb = db.withComponents(newComponents);
            
            // Check that original schemas are preserved
            expect(extendedDb.components.id).toBe(db.components.id);
            
            // Check that new schemas are added
            expect(extendedDb.components.position).toBe(newComponents.position);
            expect(extendedDb.components.velocity).toBe(newComponents.velocity);
            
            // Check that the returned database is a valid database instance
            expect(typeof extendedDb.getArchetype).toBe("function");
            expect(typeof extendedDb.selectEntity).toBe("function");
            expect(typeof extendedDb.updateEntity).toBe("function");
            expect(typeof extendedDb.deleteEntity).toBe("function");
        });
    });

    describe("getArchetype", () => {
        it("should require id component", () => {
            const db = createTestDatabase();
            expect(() => db.getArchetype(["position"])).toThrow("id is required");
        });

        it("should create archetypes with correct component combinations", () => {
            const db = createTestDatabase();

            // Get archetype with single component plus id
            const positionArchetype = db.getArchetype(["id", "position"]);
            expect(positionArchetype.components.has("position")).toBe(true);
            expect(positionArchetype.components.has("id")).toBe(true);
            expect(positionArchetype.components.size).toBe(2);

            // Get archetype with multiple components plus id
            const characterArchetype = db.getArchetype(["id", "name", "age"]);
            expect(characterArchetype.components.has("name")).toBe(true);
            expect(characterArchetype.components.has("age")).toBe(true);
            expect(characterArchetype.components.has("id")).toBe(true);
            expect(characterArchetype.components.size).toBe(3);

            // Get archetype with all components plus id
            const fullArchetype = db.getArchetype(["id", "position", "name", "age"]);
            expect(fullArchetype.components.has("position")).toBe(true);
            expect(fullArchetype.components.has("name")).toBe(true);
            expect(fullArchetype.components.has("age")).toBe(true);
            expect(fullArchetype.components.has("id")).toBe(true);
            expect(fullArchetype.components.size).toBe(4);
        });

        it("should return same archetype for same component combinations", () => {
            const db = createTestDatabase();

            const archetype1 = db.getArchetype(["id", "position", "name"]);
            const archetype2 = db.getArchetype(["id", "position", "name"]);
            expect(archetype1).toBe(archetype2);

            const archetype3 = db.getArchetype(["id", "position", "name", "age"]);
            const archetype4 = db.getArchetype(["id", "name", "position", "age"]);
            expect(archetype3).toBe(archetype4);
        });
    });

    describe("creating entities", () => {
        it("should create entities with correct component data", () => {
            const db = createTestDatabase();
            const archetype = db.getArchetype(["id", "position", "name"]);

            // Create first entity
            const entity1 = archetype.create({
                position: [1, 2, 3],
                name: "Entity 1"
            });
            expect(entity1).toBe(0);  // First entity should have id 0

            // Create second entity
            const entity2 = archetype.create({
                position: [4, 5, 6],
                name: "Entity 2"
            });
            expect(entity2).toBe(1);  // Second entity should have id 1

            // Verify entity data through database queries
            const entity1Data = db.selectEntity(entity1);
            expect(entity1Data).toEqual({
                id: 0,
                position: [1, 2, 3],
                name: "Entity 1"
            });

            const entity2Data = db.selectEntity(entity2);
            expect(entity2Data).toEqual({
                id: 1,
                position: [4, 5, 6],
                name: "Entity 2"
            });

            // Verify we can query all entities with these components
            const entities = Array.from(db.getArchetypes(["position", "name"]));
            expect(entities).toHaveLength(1);
            expect(entities[0].components.has("position")).toBe(true);
            expect(entities[0].components.has("name")).toBe(true);
            expect(entities[0].components.has("id")).toBe(true);
        });
    });

    describe("deleting entities", () => {
        it("should properly delete entities and their data", () => {
            const db = createTestDatabase();
            const archetype = db.getArchetype(["id", "position", "name"]);

            // Create entities to delete
            const entity1 = archetype.create({
                position: [1, 2, 3],
                name: "Entity 1"
            });
            const entity2 = archetype.create({
                position: [4, 5, 6],
                name: "Entity 2"
            });

            // Verify entities exist before deletion
            expect(db.selectEntity(entity1)).not.toBeNull();
            expect(db.selectEntity(entity2)).not.toBeNull();

            // Delete first entity
            db.deleteEntity(entity1);

            // Verify first entity is deleted but second remains
            expect(db.selectEntity(entity1)).toBeNull();
            expect(db.selectEntity(entity2)).not.toBeNull();

            // Create a new entity and verify it reuses the deleted entity's ID
            const entity3 = archetype.create({
                position: [7, 8, 9],
                name: "Entity 3"
            });
            expect(entity3).toBe(entity1); // Should reuse the deleted entity's ID

            // Verify the new entity's data
            const entity3Data = db.selectEntity(entity3);
            expect(entity3Data).toEqual({
                id: entity1,
                position: [7, 8, 9],
                name: "Entity 3"
            });

            // Delete all remaining entities
            db.deleteEntity(entity2);
            db.deleteEntity(entity3);

            // Verify all entities are deleted
            expect(db.selectEntity(entity1)).toBeNull();
            expect(db.selectEntity(entity2)).toBeNull();
            expect(db.selectEntity(entity3)).toBeNull();

            // Verify archetype queries return empty results
            const entities = Array.from(db.getArchetypes(["position", "name"]));
            expect(entities).toHaveLength(1); // Archetype still exists
            // TODO: Add test to verify the archetype is empty once we have a way to check row count
        });
    });

    describe("locating entities", () => {
        it("should correctly locate entities in their archetypes", () => {
            const db = createTestDatabase();
            
            // Create two different archetypes
            const positionArchetype = db.getArchetype(["id", "position"]);
            const fullArchetype = db.getArchetype(["id", "position", "name", "age"]);

            // Create entities in different archetypes
            const entity1 = positionArchetype.create({
                position: [1, 2, 3]
            });

            const entity2 = fullArchetype.create({
                position: [4, 5, 6],
                name: "Entity 2",
                age: 42
            });

            // Verify locations
            const location1 = db.locateEntity(entity1);
            expect(location1).not.toBeNull();
            expect(location1?.archetype).toBe(positionArchetype.id);
            expect(typeof location1?.row).toBe("number");

            const location2 = db.locateEntity(entity2);
            expect(location2).not.toBeNull();
            expect(location2?.archetype).toBe(fullArchetype.id);
            expect(typeof location2?.row).toBe("number");

            // Verify non-existent entity returns null
            expect(db.locateEntity(999)).toEqual({ archetype: -1, row: -1 });

            // Verify location is updated when entity is deleted
            db.deleteEntity(entity1);
            expect(db.locateEntity(entity1)).toEqual({ archetype: -1, row: -1 });

            // Verify location of remaining entity is unchanged
            const location2After = db.locateEntity(entity2);
            expect(location2After).toEqual(location2);
        });
    });

    describe("querying archetypes", () => {
        it("should correctly filter archetypes based on component queries", () => {
            const db = createTestDatabase();
            
            // Create various archetypes with different component combinations
            const positionOnly = db.getArchetype(["id", "position"]);
            const positionAndName = db.getArchetype(["id", "position", "name"]);
            const positionAndAge = db.getArchetype(["id", "position", "age"]);
            const allComponents = db.getArchetype(["id", "position", "name", "age"]);

            // Create some entities to ensure archetypes are populated
            positionOnly.create({ position: [1, 2, 3] });
            positionAndName.create({ position: [4, 5, 6], name: "Entity 1" });
            positionAndAge.create({ position: [7, 8, 9], age: 25 });
            allComponents.create({ position: [10, 11, 12], name: "Entity 2", age: 30 });

            // Test: Query for archetypes with just position
            const positionArchetypes = Array.from(db.getArchetypes(["position"]));
            expect(positionArchetypes).toHaveLength(4); // Should find all archetypes
            expect(positionArchetypes.map(a => a.id)).toContain(positionOnly.id);
            expect(positionArchetypes.map(a => a.id)).toContain(positionAndName.id);
            expect(positionArchetypes.map(a => a.id)).toContain(positionAndAge.id);
            expect(positionArchetypes.map(a => a.id)).toContain(allComponents.id);

            // Test: Query for archetypes with position AND name
            const positionNameArchetypes = Array.from(db.getArchetypes(["position", "name"]));
            expect(positionNameArchetypes).toHaveLength(2);
            expect(positionNameArchetypes.map(a => a.id)).toContain(positionAndName.id);
            expect(positionNameArchetypes.map(a => a.id)).toContain(allComponents.id);

            // Test: Query for archetypes with position but NOT age
            const noAgeArchetypes = Array.from(db.getArchetypes(
                ["position"],
                { exclude: ["age"] }
            ));
            expect(noAgeArchetypes).toHaveLength(2);
            expect(noAgeArchetypes.map(a => a.id)).toContain(positionOnly.id);
            expect(noAgeArchetypes.map(a => a.id)).toContain(positionAndName.id);

            // Test: Query for archetypes with both name AND age
            const nameAgeArchetypes = Array.from(db.getArchetypes(["name", "age"]));
            expect(nameAgeArchetypes).toHaveLength(1);
            expect(nameAgeArchetypes[0].id).toBe(allComponents.id);

            // Test: Query with multiple excludes
            const onlyPositionArchetypes = Array.from(db.getArchetypes(
                ["position"],
                { exclude: ["name", "age"] }
            ));
            expect(onlyPositionArchetypes).toHaveLength(1);
            expect(onlyPositionArchetypes[0].id).toBe(positionOnly.id);

            // Test: Query that should match no archetypes
            const emptyQuery = Array.from(db.getArchetypes(
                ["position"],
                { exclude: ["position"] }  // Contradictory query
            ));
            expect(emptyQuery).toHaveLength(0);
        });
    });

    describe("updating entities", () => {
        it("should update entity properties within same archetype", () => {
            const db = createTestDatabase();
            const archetype = db.getArchetype(["id", "position", "name"]);

            const entity = archetype.create({
                position: [1, 2, 3],
                name: "Original Name"
            });

            // Update single property
            db.updateEntity(entity, { name: "Updated Name" });
            expect(db.selectEntity(entity)).toEqual({
                id: entity,
                position: [1, 2, 3],
                name: "Updated Name"
            });

            // Update multiple properties
            db.updateEntity(entity, {
                position: [4, 5, 6],
                name: "New Name"
            });
            expect(db.selectEntity(entity)).toEqual({
                id: entity,
                position: [4, 5, 6],
                name: "New Name"
            });
        });

        it("should handle archetype changes when adding or removing components", () => {
            const db = createTestDatabase();
            const basicArchetype = db.getArchetype(["id", "position"]);
            const fullArchetype = db.getArchetype(["id", "position", "name", "age"]);

            // Create entity with basic components
            const entity = basicArchetype.create({
                position: [1, 2, 3]
            });

            // Add components (changes archetype)
            db.updateEntity(entity, {
                position: [1, 2, 3],
                name: "New Entity",
                age: 25
            });

            // Verify entity moved to new archetype with all data
            const fullData = db.selectEntity(entity);
            expect(fullData).toEqual({
                id: entity,
                position: [1, 2, 3],
                name: "New Entity",
                age: 25
            });

            // Verify location updated
            const location = db.locateEntity(entity);
            expect(location?.archetype).toBe(fullArchetype.id);

            // Remove components (changes archetype again)
            db.updateEntity(entity, {
                name: undefined,
                age: undefined
            });

            // Verify entity moved back to basic archetype
            const basicData = db.selectEntity(entity);
            expect(basicData).toEqual({
                id: entity,
                position: [1, 2, 3]
            });

            // Verify location updated
            const finalLocation = db.locateEntity(entity);
            expect(finalLocation?.archetype).toBe(basicArchetype.id);
        });

        it("should handle error cases in updates", () => {
            const db = createTestDatabase();
            const archetype = db.getArchetype(["id", "position", "name"]);

            const entity = archetype.create({
                position: [1, 2, 3],
                name: "Test Entity"
            });

            // Updating non-existent entity should throw
            expect(() => {
                db.updateEntity(999, { name: "New Name" });
            }).toThrow("Entity not found");

            // Cannot remove required id component
            expect(() => {
                db.updateEntity(entity, { id: undefined });
            }).toThrow();
        });

        it("should preserve unmodified component data when removing components", () => {
            const db = createTestDatabase();
            const fullArchetype = db.getArchetype(["id", "position", "velocity", "name", "age"]);
            
            // Create entity with all components
            const entity = fullArchetype.create({
                position: [1, 2, 3],
                velocity: [0.1, 0.2, 0.3],
                name: "Full Entity",
                age: 42
            });

            // Get initial state and use it as our baseline for comparison
            // This accounts for any initial float32 precision adjustments
            const initialState = db.selectEntity(entity);
            expect(initialState).toBeDefined();

            // Remove name and age, but don't modify position or velocity
            db.updateEntity(entity, {
                name: undefined,
                age: undefined
            });

            // Verify position and velocity data was preserved exactly
            const afterRemoval = db.selectEntity(entity);
            expect(afterRemoval).toEqual({
                id: entity,
                position: initialState!.position,
                velocity: initialState!.velocity
            });

            // Remove velocity but update position
            db.updateEntity(entity, {
                velocity: undefined,
                position: [4, 5, 6]
            });

            // Verify position was updated and other data removed
            expect(db.selectEntity(entity)).toEqual({
                id: entity,
                position: [4, 5, 6]
            });
        });
    });

    describe("integration", () => {
        it("should handle complex sequences of operations correctly", () => {
            const db = createTestDatabase();
            
            // Create different archetypes
            const basicArchetype = db.getArchetype(["id", "position"]);
            const movingArchetype = db.getArchetype(["id", "position", "velocity"]);
            const characterArchetype = db.getArchetype(["id", "position", "name", "age"]);

            // Create entities in different archetypes
            const staticEntity = basicArchetype.create({
                position: [0, 0, 0]
            });

            const movingEntity = movingArchetype.create({
                position: [1, 1, 1],
                velocity: [1, 0, 0]
            });

            const character = characterArchetype.create({
                position: [2, 2, 2],
                name: "Character 1",
                age: 25
            });

            // Verify initial state
            expect(Array.from(db.getArchetypes(["position"]))).toHaveLength(3);
            expect(db.selectEntity(staticEntity)).toEqual({
                id: staticEntity,
                position: [0, 0, 0]
            });

            // Move character to moving archetype by removing name/age and adding velocity
            db.updateEntity(character, {
                name: undefined,
                age: undefined,
                velocity: [0, 1, 0]
            });

            // Verify character moved correctly
            expect(db.locateEntity(character)?.archetype).toBe(movingArchetype.id);
            expect(db.selectEntity(character)).toEqual({
                id: character,
                position: [2, 2, 2],
                velocity: [0, 1, 0]
            });

            // Delete the static entity
            db.deleteEntity(staticEntity);
            expect(db.selectEntity(staticEntity)).toBeNull();

            // Create a new character reusing the deleted entity's ID
            const newCharacter = characterArchetype.create({
                position: [3, 3, 3],
                name: "Character 2",
                age: 30
            });
            expect(newCharacter).toBe(staticEntity); // Reused ID

            // Update multiple entities
            db.updateEntity(movingEntity, { position: [4, 4, 4] });
            db.updateEntity(character, { velocity: [1, 1, 0] });
            db.updateEntity(newCharacter, { age: 31 });

            // Verify final state
            expect(db.selectEntity(movingEntity)).toEqual({
                id: movingEntity,
                position: [4, 4, 4],
                velocity: [1, 0, 0]
            });

            expect(db.selectEntity(character)).toEqual({
                id: character,
                position: [2, 2, 2],
                velocity: [1, 1, 0]
            });

            expect(db.selectEntity(newCharacter)).toEqual({
                id: newCharacter,
                position: [3, 3, 3],
                name: "Character 2",
                age: 31
            });

            // Verify archetype queries still work
            const movingEntities = Array.from(db.getArchetypes(
                ["velocity"],
                { exclude: ["name"] }
            ));
            expect(movingEntities).toHaveLength(1);
            expect(movingEntities[0].id).toBe(movingArchetype.id);

            const characterEntities = Array.from(db.getArchetypes(["name", "age"]));
            expect(characterEntities).toHaveLength(1);
            expect(characterEntities[0].id).toBe(characterArchetype.id);
        });
    });
}); 