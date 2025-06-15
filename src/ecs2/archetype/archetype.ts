import { CoreComponents } from "../core-components";
import { Entity } from "../entity";
import { Table, ReadonlyTable } from "data/table";

export type EntityInsertValues<C> = Omit<C, "id">;
export type ArchetypeId = number;

interface BaseArchetype<C> {
    readonly id: ArchetypeId;
    readonly components: ReadonlySet<string>;
}

export interface ReadonlyArchetype<C extends CoreComponents> extends BaseArchetype<C>, ReadonlyTable<C> {
}

export interface Archetype<C extends CoreComponents = CoreComponents> extends BaseArchetype<C>, Table<C> {
    insert: (rowData: EntityInsertValues<C>) => Entity;
}
