import { createDatabase } from "ecs";

export type Player = "red" | "black";
export type BoardPoint = Player | null;
export type BoardLink = [number, number]; // [fromIndex, toIndex]

export function createStateService() {
    return createDatabase().withResources({
        board: new Array<BoardPoint>(24 ** 2).fill(null),
        links: new Array<BoardLink>(0),
        hoverIndex: null as number | null,
    }).toObservable();
}
