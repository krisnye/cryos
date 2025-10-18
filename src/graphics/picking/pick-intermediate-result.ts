import { Entity, StoreComponents } from "@adobe/data/ecs";
import { Vec3 } from "@adobe/data/math";
import { Table } from "@adobe/data/table";
import { GraphicsStore } from "graphics/database/graphics-store.js";

export type Alpha = number;

export interface PickIntermediateResult<
    S extends GraphicsStore = GraphicsStore,
    T extends Table<{ id: Entity, position: Vec3 } & Partial<StoreComponents<S>>> = Table<{ id: Entity, position: Vec3 } & Partial<StoreComponents<S>>>
> {
    table: T;
    row: number;
    alpha: Alpha;
}
