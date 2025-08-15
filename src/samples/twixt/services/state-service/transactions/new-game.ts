import { BoardPoint } from "../state-service.js";
import { boardSize } from "../dependent-state/board-size.js";
import { TwixtStore } from "../state-service.js";

export const newGame = (t: TwixtStore) => {
    const size = boardSize(t);
    t.resources.board = new Array<BoardPoint>(size ** 2).fill(null);
    t.resources.links = [];
};
