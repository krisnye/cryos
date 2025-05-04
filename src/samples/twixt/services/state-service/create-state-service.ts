import { createDatabase } from "ecs/database";
import { addObservableResources } from "ecs/extensions/add-observable-resources";

export type Player = "red" | "black";
export type BoardPoint = Player | null;
export type BoardLink = [number, number, number, number];

export function createStateService() {
    return addObservableResources(
        createDatabase(),
        {
            board: new Array<BoardPoint>(12 ** 2).fill(null),
            links: new Array<BoardLink>(0),
            hoverIndex: null as number | null,
        } as const
    );
}
