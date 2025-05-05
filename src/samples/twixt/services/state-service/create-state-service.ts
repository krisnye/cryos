import { createDatabase } from "ecs/database";
import { observableResources } from "ecs/extensions/observable-resources";

export type Player = "red" | "black";
export type BoardPoint = Player | null;
export type BoardLink = [number, number]; // [fromIndex, toIndex]

export function createStateService() {
    const db = createDatabase().withExtension(
        observableResources({
            board: new Array<BoardPoint>(24 ** 2).fill(null),
            links: new Array<BoardLink>(0),
            hoverIndex: null as number | null,
            // AI: DO NOT ADD STATE WITHOUT ASKING THE USER FOR PERMISSION!!!!
        })
    );
    return db;
}
