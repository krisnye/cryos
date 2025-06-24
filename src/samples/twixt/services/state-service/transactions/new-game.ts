import { BoardPoint } from "../state-service.js";
import { boardSize } from "../dependent-state/board-size.js";
import { TwixtStore } from "../state-service.js";

export const newGame = (store: TwixtStore) => () => {
    const size = boardSize(store);
    store.resources.board = new Array<BoardPoint>(size ** 2).fill(null);
    store.resources.links = [];
};
