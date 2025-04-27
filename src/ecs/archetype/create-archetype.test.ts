import { describe, it, expect } from 'vitest';
import { createArchetype } from 'ecs/archetype';
import { createEntityLocationTable } from 'ecs/entity-location-table';
import { EntitySchema } from 'ecs';
import { U32Schema } from 'data';

describe('createArchetype', () => {
    it('should create an archetype with basic components', () => {
        const entityLocationTable = createEntityLocationTable();
        const components = {
            id: EntitySchema,
            value: U32Schema,
        };
        const id = 1;

        const archetype = createArchetype(components, id, entityLocationTable);

        // Verify basic properties
        expect(archetype.id).toBe(id);
        expect(archetype.rows).toBe(0);
        expect(archetype.components).toEqual(new Set(['id', 'value']));
        expect(archetype.columns).toHaveProperty('id');
        expect(archetype.columns).toHaveProperty('value');
    });

    it('should create entities with correct ids and data', () => {
        const entityLocationTable = createEntityLocationTable();
        const components = {
            id: EntitySchema,
            value: U32Schema,
        };
        const id = 1;

        const archetype = createArchetype(components, id, entityLocationTable);

        // Create first entity
        const entity1 = archetype.create({ value: 42 });
        expect(entity1).toBe(0); // First entity should have id 0
        expect(archetype.rows).toBe(1);
        expect(archetype.columns.id.get(0)).toBe(0);
        expect(archetype.columns.value.get(0)).toBe(42);

        // Create second entity
        const entity2 = archetype.create({ value: 100 });
        expect(entity2).toBe(1); // Second entity should have id 1
        expect(archetype.rows).toBe(2);
        expect(archetype.columns.id.get(1)).toBe(1);
        expect(archetype.columns.value.get(1)).toBe(100);

        // Verify entity locations in EntityLocationTable
        const location1 = entityLocationTable.locateEntity(entity1);
        expect(location1).toEqual({ archetype: id, row: 0 });

        const location2 = entityLocationTable.locateEntity(entity2);
        expect(location2).toEqual({ archetype: id, row: 1 });
    });

    it('should handle multiple component types', () => {
        const entityLocationTable = createEntityLocationTable();
        const components = {
            id: EntitySchema,
            health: U32Schema,
            mana: U32Schema,
            level: U32Schema,
        };
        const id = 2;

        const archetype = createArchetype(components, id, entityLocationTable);

        // Verify components are set up correctly
        expect(archetype.components).toEqual(new Set(['id', 'health', 'mana', 'level']));
        expect(archetype.columns).toHaveProperty('health');
        expect(archetype.columns).toHaveProperty('mana');
        expect(archetype.columns).toHaveProperty('level');

        // Create an entity with all components
        const entity = archetype.create({
            health: 100,
            mana: 50,
            level: 5,
        });

        expect(entity).toBe(0);
        expect(archetype.rows).toBe(1);
        expect(archetype.columns.health.get(0)).toBe(100);
        expect(archetype.columns.mana.get(0)).toBe(50);
        expect(archetype.columns.level.get(0)).toBe(5);
        expect(archetype.columns.id.get(0)).toBe(0);

        // Verify entity location
        const location = entityLocationTable.locateEntity(entity);
        expect(location).toEqual({ archetype: id, row: 0 });
    });
}); 