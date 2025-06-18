import { mutableClone } from "data/functions/mutable-clone";
import { TwixtStore } from "../state-service";
import { calculateNewLinks } from "samples/twixt/functions/calculate-new-links";
import { currentPlayer } from "../dependent-state/current-player";
import { validHoverIndex } from "../dependent-state/valid-hover-index";

export const clickPoint = (db: TwixtStore) => {
    const index = validHoverIndex(db);
    if (index) {
        const player = currentPlayer(db);
        const board = mutableClone(db.resources.board);
        if (board[index] === null) {
            board[index] = player;
            db.resources.board = board;
            const links = db.resources.links;
            const newLinks = calculateNewLinks(player, index, board, links);
            db.resources.links = [...links, ...newLinks];    
        }
    }
};
