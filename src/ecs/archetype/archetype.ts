import { Table } from "data";
import { ReadonlyTable } from "data/table";
import { Entity } from "ecs";
import { CoreComponents } from "ecs/database/core-components";

export type EntityCreateValues<C> = Omit<C, "id">;

export type ArchetypeId = number;

export interface ReadonlyArchetype<C> extends ReadonlyTable<C> {
    readonly id: ArchetypeId;
    readonly components: ReadonlySet<string>;
}

export interface Archetype<C = CoreComponents> extends Table<C> {
    readonly id: ArchetypeId;
    readonly components: ReadonlySet<string>;
    create: (rowData: EntityCreateValues<C>) => Entity;
}
