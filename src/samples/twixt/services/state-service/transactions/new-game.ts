import { BoardPoint } from "../state-service";
import { boardSize } from "../dependent-state/board-size";
import { TwixtStore } from "../state-service";

export const newGame = (store: TwixtStore) => {
    const size = boardSize(store);
    store.resources.board = new Array<BoardPoint>(size ** 2).fill(null);
    store.resources.links = [];
};
