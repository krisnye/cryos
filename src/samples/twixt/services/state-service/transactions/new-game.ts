import { BoardPoint } from "../state-service.js";
import { boardSize } from "../dependent-state/board-size.js";
import { TwixtTransaction } from "../state-service.js";

export const newGame = (t: TwixtTransaction) => {
    const size = boardSize(t);
    t.resources.board = new Array<BoardPoint>(size ** 2).fill(null);
    t.resources.links = [];
};
