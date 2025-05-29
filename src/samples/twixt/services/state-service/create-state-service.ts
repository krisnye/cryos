import { createDatabase } from "ecs";

export type Player = "red" | "black";
export type BoardPoint = Player | null;
export type BoardLink = [number, number]; // [fromIndex, toIndex]

export type CoreDatabase = ReturnType<typeof createCoreDatabase>;

function createCoreDatabase() {
    return createDatabase().withResources({
        board: new Array<BoardPoint>(24 ** 2).fill(null),
        links: new Array<BoardLink>(0),
        hoverIndex: null as number | null,
    })
}

export function createStateService() {
    return createCoreDatabase().toObservable();
}
