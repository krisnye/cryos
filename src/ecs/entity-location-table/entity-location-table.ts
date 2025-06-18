import { Entity } from "../entity";
import { EntityLocation } from "../entity-location";

export interface EntityLocationTable {
    create: (location: EntityLocation) => Entity;
    update: (entity: Entity, location: EntityLocation) => void;
    delete: (entity: Entity) => void;
    locate: (entity: Entity) => EntityLocation | null;
}
