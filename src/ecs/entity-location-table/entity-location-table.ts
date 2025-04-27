import { Entity, EntityLocation } from "ecs";

export interface EntityLocationTable {
    createEntity: (location: EntityLocation) => Entity;
    updateEntity: (entity: Entity, location: EntityLocation) => void;
    deleteEntity: (entity: Entity) => void;
    locateEntity: (entity: Entity) => EntityLocation;
}
