import { grow } from "data/array-buffer-like/grow";
import { Entity, EntityLocation } from "ecs";
import { EntityLocationTable } from "./entity-location-table";

export const createEntityLocationTable = (initialCapacity: number = 16): EntityLocationTable => {

    /**
     * The index of the first free entity in the free list or -1 if the free list is empty.
     */
    let freeListHead = -1;
    /**
     * The next index to use for a new entity once the free list is exhausted.
     */
    let nextIndex = 0;
    let capacity = Math.max(initialCapacity, 16);

    const array = new ArrayBuffer(capacity * 2 * 4, { maxByteLength: 1024 * 1024 * 1024 });
    const entities = new Int32Array(array);

    const createEntity = ({ archetype, row }: EntityLocation): Entity => {
        let entity: number;
        if (freeListHead >= 0) {
            entity = freeListHead;
            const index = freeListHead << 1;
            freeListHead = entities[index + 1];
        }
        else {
            entity = nextIndex++;
            if (nextIndex >= capacity) {
                capacity *= 2;
                grow(array, capacity * 2 * 4);
            }
        }

        const index = entity << 1;
        entities[index + 0] = archetype;
        entities[index + 1] = row;

        return entity;
    }

    const deleteEntity = (entity: Entity) => {
        const index = entity << 1;
        entities[index + 0] = -1;
        entities[index + 1] = freeListHead;
        freeListHead = entity;
    }

    const locateEntity = (entity: Entity): EntityLocation => {
        if (entity >= nextIndex) {
            return { archetype: -1, row: -1 };
        }
        const index = entity << 1;
        const archetype = entities[index + 0];
        const row = entities[index + 1];
        return { archetype, row };
    }

    const updateEntity = (entity: Entity, location: EntityLocation) => {
        const index = entity << 1;
        entities[index + 0] = location.archetype;
        entities[index + 1] = location.row;
    }

    return {
        createEntity,
        deleteEntity,
        locateEntity,
        updateEntity,
    };
}
