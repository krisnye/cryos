import { BoardPoint } from "../create-state-service2";
import { boardSize } from "../dependent-state/board-size";
import { TwixtStore } from "../create-state-service2";

export const newGame = (store: TwixtStore) => {
    const size = boardSize(store);
    store.resources.board = new Array<BoardPoint>(size ** 2).fill(null);
    store.resources.links = [];
};
