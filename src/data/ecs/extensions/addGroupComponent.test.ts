import { describe, it, expect } from 'vitest';
import { Vec3Schema } from '../../Vec3/Vec3';
import { createDatabase } from '../createDatabase';
import { addGroupArchetype } from './addGroupComponent';

describe('createGroupComponent', () => {
    it('should sort particles by x position into separate archetypes', () => {
        const db = createDatabase().withComponents({ position: Vec3Schema } as const).withArchetypes({ particle: ["id", "position"]} as const);
        const db2 = addGroupArchetype(db, {
            archetype: db.archetypes.particle,
            name: "Particle",
            group: (componentValues) => componentValues.position[0]
        }).simplifyTypes();

        //  now let's create some particles.
        const particle1 = db2.actions.createParticle({ position: [1, 1, 1] });
        const particle2 = db2.actions.createParticle({ position: [1, 2, 2] });
        const particle3 = db2.actions.createParticle({ position: [2, 2, 2] });
        const particle4 = db2.actions.createParticle({ position: [2, 3, 3] });
        const particle5 = db2.actions.createParticle({ position: [3, 3, 3] });

        const archetypes = [...db2.getArchetypes(["position"])].filter(a => a.rows);
        expect(archetypes.length).toEqual(3);    
        const total = archetypes.reduce((acc, a) => acc + a.rows, 0);
        expect(total).toEqual(5);
    });

}); 