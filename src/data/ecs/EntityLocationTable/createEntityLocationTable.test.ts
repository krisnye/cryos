import { describe, it, expect } from 'vitest';
import { createEntityLocationTable } from './createEntityLocationTable';
import { Entity } from '../Entity';

describe('createEntityLocationTable', () => {
    it('should create entities with increasing ids starting from 0', () => {
        const table = createEntityLocationTable();
        
        const entity0 = table.createEntity({ archetype: 1, row: 10 });
        const entity1 = table.createEntity({ archetype: 2, row: 20 });
        const entity2 = table.createEntity({ archetype: 3, row: 30 });

        expect(entity0).toBe(0);
        expect(entity1).toBe(1);
        expect(entity2).toBe(2);
    });

    it('should store and retrieve entity locations correctly', () => {
        const table = createEntityLocationTable();
        
        const entity = table.createEntity({ archetype: 42, row: 123 });
        const location = table.locateEntity(entity);

        expect(location).toEqual({ archetype: 42, row: 123 });
    });

    it('should reuse deleted entity ids', () => {
        const table = createEntityLocationTable();
        
        const entity0 = table.createEntity({ archetype: 1, row: 10 });
        const entity1 = table.createEntity({ archetype: 2, row: 20 });
        const entity2 = table.createEntity({ archetype: 3, row: 30 });

        // Delete entity1
        table.deleteEntity(entity1);

        // Create a new entity - should reuse entity1's id
        const entity3 = table.createEntity({ archetype: 4, row: 40 });
        expect(entity3).toBe(1);

        // Verify the new entity's location
        const location = table.locateEntity(entity3);
        expect(location).toEqual({ archetype: 4, row: 40 });
    });

    it('should reuse multiple deleted entities in LIFO order', () => {
        const table = createEntityLocationTable();
        
        // Create initial entities
        const entity0 = table.createEntity({ archetype: 1, row: 10 });
        const entity1 = table.createEntity({ archetype: 2, row: 20 });
        const entity2 = table.createEntity({ archetype: 3, row: 30 });
        const entity3 = table.createEntity({ archetype: 4, row: 40 });

        // Delete entities in sequence
        table.deleteEntity(entity1); // First deletion
        table.deleteEntity(entity2); // Second deletion
        table.deleteEntity(entity0); // Third deletion

        // Recreate entities - should get IDs in reverse deletion order
        const newEntity1 = table.createEntity({ archetype: 5, row: 50 });
        expect(newEntity1).toBe(0); // Should get entity0's id (last deleted)
        expect(table.locateEntity(newEntity1)).toEqual({ archetype: 5, row: 50 });

        const newEntity2 = table.createEntity({ archetype: 6, row: 60 });
        expect(newEntity2).toBe(2); // Should get entity2's id (second-to-last deleted)
        expect(table.locateEntity(newEntity2)).toEqual({ archetype: 6, row: 60 });

        const newEntity3 = table.createEntity({ archetype: 7, row: 70 });
        expect(newEntity3).toBe(1); // Should get entity1's id (first deleted)
        expect(table.locateEntity(newEntity3)).toEqual({ archetype: 7, row: 70 });

        // Creating one more should create a new ID since free list is empty
        const newEntity4 = table.createEntity({ archetype: 8, row: 80 });
        expect(newEntity4).toBe(4); // Should get a new ID
        expect(table.locateEntity(newEntity4)).toEqual({ archetype: 8, row: 80 });
    });

    it('should return invalid location for out of bounds or deleted entities', () => {
        const table = createEntityLocationTable();
        
        // Out of bounds
        const outOfBoundsLocation = table.locateEntity(999 as Entity);
        expect(outOfBoundsLocation).toEqual({ archetype: -1, row: -1 });

        // Deleted entity
        const entity = table.createEntity({ archetype: 1, row: 10 });
        table.deleteEntity(entity);
        const deletedLocation = table.locateEntity(entity);
        expect(deletedLocation.archetype).toBe(-1);
    });

    it('should grow capacity when adding many entities', () => {
        const initialCapacity = 16;
        const table = createEntityLocationTable(initialCapacity);
        const entities: Entity[] = [];

        // Create more entities than initial capacity
        for (let i = 0; i < initialCapacity + 5; i++) {
            const entity = table.createEntity({ archetype: i, row: i * 10 });
            entities.push(entity);
            // Verify entity was created correctly
            expect(entity).toBe(i);
            const location = table.locateEntity(entity);
            expect(location).toEqual({ archetype: i, row: i * 10 });
        }

        // Delete some entities that span across the initial capacity boundary
        table.deleteEntity(initialCapacity - 1);
        table.deleteEntity(initialCapacity);
        table.deleteEntity(initialCapacity + 1);

        // Create new entities and verify they reuse the deleted IDs
        const newEntity1 = table.createEntity({ archetype: 100, row: 1000 });
        const newEntity2 = table.createEntity({ archetype: 101, row: 1010 });
        const newEntity3 = table.createEntity({ archetype: 102, row: 1020 });

        // Verify the entities were reused in LIFO order
        expect(newEntity1).toBe(initialCapacity + 1);
        expect(newEntity2).toBe(initialCapacity);
        expect(newEntity3).toBe(initialCapacity - 1);

        // Verify their locations are correct
        expect(table.locateEntity(newEntity1)).toEqual({ archetype: 100, row: 1000 });
        expect(table.locateEntity(newEntity2)).toEqual({ archetype: 101, row: 1010 });
        expect(table.locateEntity(newEntity3)).toEqual({ archetype: 102, row: 1020 });
    });

    it('should update entity locations correctly', () => {
        const table = createEntityLocationTable();
        
        // Create an initial entity
        const entity = table.createEntity({ archetype: 1, row: 10 });
        expect(table.locateEntity(entity)).toEqual({ archetype: 1, row: 10 });

        // Update the entity location
        table.updateEntity(entity, { archetype: 2, row: 20 });
        expect(table.locateEntity(entity)).toEqual({ archetype: 2, row: 20 });

        // Update again to verify multiple updates work
        table.updateEntity(entity, { archetype: 3, row: 30 });
        expect(table.locateEntity(entity)).toEqual({ archetype: 3, row: 30 });

        // Create another entity and verify the first one remains unchanged
        const entity2 = table.createEntity({ archetype: 4, row: 40 });
        expect(table.locateEntity(entity)).toEqual({ archetype: 3, row: 30 });
        expect(table.locateEntity(entity2)).toEqual({ archetype: 4, row: 40 });
    });
}); 