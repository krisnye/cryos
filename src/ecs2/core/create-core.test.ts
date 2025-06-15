import { describe, it, expect } from "vitest";
import { createCore } from "./create-core";
import { F32Schema, U32Schema, I32Schema, Schema } from "data";
import type { Core } from "./core";
import type { Entity } from "../entity";

describe("createCore", () => {
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

    const nameSchema = {
        type: "string",
        maxLength: 50,
    } as const satisfies Schema;

    it("should create core with basic components", () => {
        const core = createCore({
            position: positionSchema,
            health: healthSchema,
        });

        expect(core).toBeDefined();
        expect(core.components).toHaveProperty("id");
        expect(core.components).toHaveProperty("position");
        expect(core.components).toHaveProperty("health");
        expect(core.components.id).toBeDefined();
        expect(core.components.position).toBeDefined();
        expect(core.components.health).toBeDefined();
    });

    it("should query archetypes correctly", () => {
        const core = createCore({
            position: positionSchema,
            health: healthSchema,
        });

        // Create entities with different component combinations
        const archetype1 = core.ensureArchetype(["id", "position"]);
        const entity1 = archetype1.insert({ position: { x: 1, y: 2, z: 3 } });

        const archetype2 = core.ensureArchetype(["id", "health"]);
        const entity2 = archetype2.insert({ health: { current: 100, max: 100 } });

        const archetype3 = core.ensureArchetype(["id", "position", "health"]);
        const entity3 = archetype3.insert({ 
            position: { x: 0, y: 0, z: 0 },
            health: { current: 50, max: 100 }
        });

        // Query for position component
        const positionArchetypes = core.queryArchetypes(["position"]);
        expect(positionArchetypes).toHaveLength(2);
        expect(positionArchetypes.some(a => a.components.has("position"))).toBe(true);
        expect(positionArchetypes.some(a => a.components.has("health"))).toBe(true);

        // Query for health component
        const healthArchetypes = core.queryArchetypes(["health"]);
        expect(healthArchetypes).toHaveLength(2);
        expect(healthArchetypes.some(a => a.components.has("position"))).toBe(true);
        expect(healthArchetypes.some(a => a.components.has("health"))).toBe(true);

        // Query for both components
        const bothArchetypes = core.queryArchetypes(["position", "health"]);
        expect(bothArchetypes).toHaveLength(1);
        expect(bothArchetypes[0].components.has("position")).toBe(true);
        expect(bothArchetypes[0].components.has("health")).toBe(true);
    });

    it("should query archetypes with exclude option", () => {
        const core = createCore({
            position: positionSchema,
            health: healthSchema,
        });

        // Create entities with different component combinations
        const archetype1 = core.ensureArchetype(["id", "position"]);
        const entity1 = archetype1.insert({ position: { x: 1, y: 2, z: 3 } });

        const archetype2 = core.ensureArchetype(["id", "health"]);
        const entity2 = archetype2.insert({ health: { current: 100, max: 100 } });

        const archetype3 = core.ensureArchetype(["id", "position", "health"]);
        const entity3 = archetype3.insert({ 
            position: { x: 0, y: 0, z: 0 },
            health: { current: 50, max: 100 }
        });

        // Query for position but exclude health
        const positionOnlyArchetypes = core.queryArchetypes(["position"], { exclude: ["health"] });
        expect(positionOnlyArchetypes).toHaveLength(1);
        expect(positionOnlyArchetypes[0].components.has("position")).toBe(true);
        expect((positionOnlyArchetypes[0].components as Set<string>).has("health")).toBe(false);
    });

    it("should ensure archetype creates new archetype when needed", () => {
        const core = createCore({
            position: positionSchema,
            health: healthSchema,
        } as const);

        // First call should create new archetype
        const archetype1 = core.ensureArchetype(["id", "position"]);
        expect(archetype1).toBeDefined();
        expect(archetype1.components.has("id")).toBe(true);
        expect(archetype1.components.has("position")).toBe(true);
        expect((archetype1.components as Set<string>).has("health")).toBe(false);

        // Second call with same components should return same archetype
        const archetype2 = core.ensureArchetype(["id", "position"]);
        expect(archetype2).toBe(archetype1);

        // Different components should create new archetype
        const archetype3 = core.ensureArchetype(["id", "health"]);
        expect(archetype3).not.toBe(archetype1);
        expect(archetype3.components.has("id")).toBe(true);
        expect(archetype3.components.has("health")).toBe(true);
        expect(archetype3.components.has("position")).toBe(false);
    });

    it("should throw error when ensuring archetype without id", () => {
        const core = createCore({
            position: positionSchema,
        });

        expect(() => {
            core.ensureArchetype(["position"]);
        }).toThrow("id is required");
    });

    it("should locate entities correctly", () => {
        const core = createCore({
            position: positionSchema,
        });

        const archetype = core.ensureArchetype(["id", "position"]);
        const entity = archetype.insert({ position: { x: 1, y: 2, z: 3 } });

        const location = core.locate(entity);
        expect(location).not.toBeNull();
        expect(location?.archetype).toBe(archetype.id);
        expect(location?.row).toBeGreaterThanOrEqual(0);
    });

    it("should return null when locating non-existent entity", () => {
        const core = createCore({
            position: positionSchema,
        });

        const location = core.locate(999 as Entity);
        expect(location).toBeNull();
    });

    it("should read entity data correctly", () => {
        const core = createCore({
            position: positionSchema,
        });

        const archetype = core.ensureArchetype(["id", "position"]);
        const entity = archetype.insert({ position: { x: 1, y: 2, z: 3 } });

        const data = core.read(entity);
        expect(data).not.toBeNull();
        expect(data?.id).toBe(entity);
        expect(data?.position).toEqual({ x: 1, y: 2, z: 3 });
    });

    it("should return null when reading non-existent entity", () => {
        const core = createCore({
            position: positionSchema,
        });

        const data = core.read(999 as Entity);
        expect(data).toBeNull();
    });

    it("should delete entities correctly", () => {
        const core = createCore({
            position: positionSchema,
        });

        const archetype = core.ensureArchetype(["id", "position"]);
        const entity = archetype.insert({ position: { x: 1, y: 2, z: 3 } });

        // Verify entity exists
        expect(core.locate(entity)).not.toBeNull();
        expect(core.read(entity)).not.toBeNull();

        // Delete entity
        core.delete(entity);

        // Verify entity no longer exists
        expect(core.locate(entity)).toBeNull();
        expect(core.read(entity)).toBeNull();
    });

    it("should handle deleting non-existent entity gracefully", () => {
        const core = createCore({
            position: positionSchema,
        });

        // Should not throw
        expect(() => {
            core.delete(999 as Entity);
        }).not.toThrow();
    });

    it("should update entity within same archetype", () => {
        const core = createCore({
            position: positionSchema,
        });

        const archetype = core.ensureArchetype(["id", "position"]);
        const entity = archetype.insert({ position: { x: 1, y: 2, z: 3 } });

        // Update position
        core.update(entity, { position: { x: 10, y: 20, z: 30 } });

        const data = core.read(entity);
        expect(data?.position).toEqual({ x: 10, y: 20, z: 30 });
        expect(data?.id).toBe(entity);
    });

    it("should move entity to new archetype when adding components", () => {
        const core = createCore({
            position: positionSchema,
            health: healthSchema,
        });

        const archetype1 = core.ensureArchetype(["id", "position"]);
        const entity = archetype1.insert({ position: { x: 1, y: 2, z: 3 } });

        // Add health component
        core.update(entity, { health: { current: 100, max: 100 } });

        const data = core.read(entity);
        expect(data?.position).toEqual({ x: 1, y: 2, z: 3 });
        expect(data?.health).toEqual({ current: 100, max: 100 });

        // Entity should now be in a different archetype
        const location = core.locate(entity);
        const newArchetype = core.queryArchetypes(["id", "position", "health"])[0];
        expect(location?.archetype).toBe(newArchetype.id);
    });

    it("should move entity to new archetype when removing components", () => {
        const core = createCore({
            position: positionSchema,
            health: healthSchema,
        });

        const archetype1 = core.ensureArchetype(["id", "position", "health"]);
        const entity = archetype1.insert({ 
            position: { x: 1, y: 2, z: 3 },
            health: { current: 100, max: 100 }
        });

        // Remove health component
        core.update(entity, { health: undefined });

        const data = core.read(entity);
        expect(data?.position).toEqual({ x: 1, y: 2, z: 3 });
        expect(data?.health).toBeUndefined();

        // Entity should now be in a different archetype
        const location = core.locate(entity);
        const allArchetypes = core.queryArchetypes(["id", "position"]);
        const newArchetype = allArchetypes.find(a => a.id === location?.archetype);
        expect(newArchetype).toBeDefined();
        expect(newArchetype?.components.has("position")).toBe(true);
        expect((newArchetype?.components as Set<string>).has("health")).toBe(false);
    });

    it("should throw error when updating non-existent entity", () => {
        const core = createCore({
            position: positionSchema,
        });

        expect(() => {
            core.update(999 as Entity, { position: { x: 1, y: 2, z: 3 } });
        }).toThrow("Entity not found");
    });

    it("should handle complex component updates", () => {
        const core = createCore({
            position: positionSchema,
            health: healthSchema,
            name: nameSchema,
        });

        const archetype1 = core.ensureArchetype(["id", "position"]);
        const entity = archetype1.insert({ position: { x: 1, y: 2, z: 3 } });

        // Add multiple components at once
        core.update(entity, {
            health: { current: 100, max: 100 },
            name: "Player1"
        });

        const data = core.read(entity);
        expect(data?.position).toEqual({ x: 1, y: 2, z: 3 });
        expect(data?.health).toEqual({ current: 100, max: 100 });
        expect(data?.name).toBe("Player1");
    });

    it("should handle mixed add/remove operations", () => {
        const core = createCore({
            position: positionSchema,
            health: healthSchema,
            name: nameSchema,
        });

        const archetype1 = core.ensureArchetype(["id", "position", "health"]);
        const entity = archetype1.insert({ 
            position: { x: 1, y: 2, z: 3 },
            health: { current: 100, max: 100 }
        });

        // Remove health and add name
        core.update(entity, {
            health: undefined,
            name: "Player1"
        });

        const data = core.read(entity);
        expect(data?.position).toEqual({ x: 1, y: 2, z: 3 });
        expect(data?.health).toBeUndefined();
        expect(data?.name).toBe("Player1");
    });

    it("should maintain entity count correctly", () => {
        const core = createCore({
            position: positionSchema,
        });

        const archetype = core.ensureArchetype(["id", "position"]);
        
        // Create multiple entities
        const entity1 = archetype.insert({ position: { x: 1, y: 2, z: 3 } });
        const entity2 = archetype.insert({ position: { x: 4, y: 5, z: 6 } });
        const entity3 = archetype.insert({ position: { x: 7, y: 8, z: 9 } });

        // Verify all entities exist
        expect(core.read(entity1)).not.toBeNull();
        expect(core.read(entity2)).not.toBeNull();
        expect(core.read(entity3)).not.toBeNull();

        // Delete middle entity
        core.delete(entity2);

        // Verify correct entities exist
        expect(core.read(entity1)).not.toBeNull();
        expect(core.read(entity2)).toBeNull();
        expect(core.read(entity3)).not.toBeNull();
    });

    it("should handle empty component updates", () => {
        const core = createCore({
            position: positionSchema,
        });

        const archetype = core.ensureArchetype(["id", "position"]);
        const entity = archetype.insert({ position: { x: 1, y: 2, z: 3 } });

        // Update with empty object
        core.update(entity, {});

        const data = core.read(entity);
        expect(data?.position).toEqual({ x: 1, y: 2, z: 3 });
        expect(data?.id).toBe(entity);
    });

    it("should handle large number of entities", () => {
        const core = createCore({
            position: positionSchema,
        });

        const archetype = core.ensureArchetype(["id", "position"]);
        const entities: Entity[] = [];

        // Create 100 entities
        for (let i = 0; i < 100; i++) {
            const entity = archetype.insert({ position: { x: i, y: i, z: i } });
            entities.push(entity);
        }

        // Verify all entities exist
        for (let i = 0; i < 100; i++) {
            const data = core.read(entities[i]);
            expect(data).not.toBeNull();
            expect(data?.position).toEqual({ x: i, y: i, z: i });
        }

        // Delete every other entity
        for (let i = 0; i < 100; i += 2) {
            core.delete(entities[i]);
        }

        // Verify correct entities exist
        for (let i = 0; i < 100; i++) {
            if (i % 2 === 0) {
                expect(core.read(entities[i])).toBeNull();
            } else {
                expect(core.read(entities[i])).not.toBeNull();
            }
        }
    });
}); 