import { createStore } from "ecs/store/create-store";
import { createDatabase } from "ecs/database/create-database";
import * as transactions from "./transactions";
import { observeDependentValue } from "ecs";
import { winner } from "./dependent-state/winner";
import { boardSize } from "./dependent-state/board-size";
import { currentPlayer } from "./dependent-state/current-player";
import { ToReadonlyStore } from "ecs/store";
import { BoardLink, BoardPoint } from "./state-service";

export function createTwixtStore() {
    return createStore({} as const, {
        board: new Array<BoardPoint>(24 ** 2).fill(null),
        links: new Array<BoardLink>(0),
        hoverIndex: null as number | null,
    } as const)
}

export type TwixtStore = ReturnType<typeof createTwixtStore>;
export type TwixtReadonlyStore = ToReadonlyStore<TwixtStore>;

export function createTwixtDatabase() {
    return createDatabase(
        createTwixtStore(),
        transactions
    );
}

export function createTwixtStateService() {
    const database = createTwixtDatabase();
    return {
        database,
        observe: {
            winner: observeDependentValue(database, winner),
            boardSize: observeDependentValue(database, boardSize),
            currentPlayer: observeDependentValue(database, currentPlayer),
        }
    }
}
