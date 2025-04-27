import { Table } from "data";
import { Entity } from "ecs";

export interface Archetype<C> extends Readonly<Table<C>> {
    __brand: "Archetype";
    readonly id: number;
    readonly components: ReadonlySet<string>;
    create: (rowData: Omit<C, "id">) => Entity;
}
