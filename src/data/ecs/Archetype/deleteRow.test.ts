import { describe, it, expect } from 'vitest';
import { createEntityLocationTable } from '../EntityLocationTable/createEntityLocationTable';
import { createArchetype } from './createArchetype';
import { Archetype_deleteRow } from './deleteRow';
import { EntitySchema } from '../Entity';
import { U32Schema } from '../../U32';

describe('Archetype_deleteRow', () => {
    it('should delete a row from the middle and update moved entity location', () => {
        const entityLocationTable = createEntityLocationTable();
        const archetype = createArchetype(
            { 
                id: EntitySchema,
                value: U32Schema 
            },
            1,
            entityLocationTable
        );

        // Create three entities
        const entity1 = archetype.create({ value: 100 });
        const entity2 = archetype.create({ value: 200 });
        const entity3 = archetype.create({ value: 300 });

        // Delete the middle entity (entity2)
        Archetype_deleteRow(archetype, entity2, entityLocationTable);

        // Verify entity3 was moved to position 1
        expect(archetype.columns.id.get(1)).toBe(entity3);
        expect(archetype.columns.value.get(1)).toBe(300);

        // Verify entity location table was updated for the moved entity
        const movedEntityLocation = entityLocationTable.locateEntity(entity3);
        expect(movedEntityLocation).toEqual({ archetype: 1, row: 1 });

        // Verify total rows decreased
        expect(archetype.rows).toBe(2);

        // Verify entity1 is unchanged
        expect(archetype.columns.id.get(0)).toBe(entity1);
        expect(archetype.columns.value.get(0)).toBe(100);
    });

    it('should handle deleting the last row without moving entities', () => {
        const entityLocationTable = createEntityLocationTable();
        const archetype = createArchetype(
            { 
                id: EntitySchema,
                value: U32Schema 
            },
            1,
            entityLocationTable
        );

        // Create two entities
        const entity1 = archetype.create({ value: 100 });
        const entity2 = archetype.create({ value: 200 });

        // Delete the last entity (entity2)
        Archetype_deleteRow(archetype, entity2, entityLocationTable);

        // Verify total rows decreased
        expect(archetype.rows).toBe(1);

        // Verify entity1 is unchanged
        expect(archetype.columns.id.get(0)).toBe(entity1);
        expect(archetype.columns.value.get(0)).toBe(100);
    });

    it('should handle deleting the only row', () => {
        const entityLocationTable = createEntityLocationTable();
        const archetype = createArchetype(
            { 
                id: EntitySchema,
                value: U32Schema 
            },
            1,
            entityLocationTable
        );

        // Create one entity
        const entity1 = archetype.create({ value: 100 });

        // Delete the only entity
        Archetype_deleteRow(archetype, 0, entityLocationTable);

        // Verify total rows is zero
        expect(archetype.rows).toBe(0);
    });
}); 