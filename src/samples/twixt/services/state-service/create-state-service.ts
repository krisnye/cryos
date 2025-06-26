import { createStore, createDatabase, observeDependentValue, ToReadonlyStore } from "@adobe/data/ecs";
import * as transactions from "./transactions/index.js";
import { winner } from "./dependent-state/winner.js";
import { boardSize } from "./dependent-state/board-size.js";
import { currentPlayer } from "./dependent-state/current-player.js";
import { BoardLink, BoardPoint } from "./state-service.js";
import { applyArg } from "@adobe/data/functions";

export function createTwixtStore() {
    return createStore({} as const, {
        board: { default: new Array<BoardPoint>(24 ** 2).fill(null) },
        links: { default: new Array<BoardLink>(0) },
        hoverIndex: { default: null as number | null },
    } as const)
}

export type TwixtStore = ReturnType<typeof createTwixtStore>;
export type TwixtReadonlyStore = ToReadonlyStore<TwixtStore>;

export function createTwixtDatabase() {
    return createDatabase(
        createTwixtStore(),
        (store) => applyArg(store, transactions)
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
