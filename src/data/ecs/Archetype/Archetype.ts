import { Table } from "../../Table/Table";
import { Entity } from "../Entity";

export interface Archetype<C> extends Readonly<Table<C>> {
    __brand: "Archetype";
    readonly id: number;
    readonly components: ReadonlySet<string>;
    create: (rowData: Omit<C, "id">) => Entity;
}
