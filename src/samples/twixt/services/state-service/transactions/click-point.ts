import { mutableClone } from "@adobe/data";
import { TwixtStore } from "../state-service.js";
import { calculateNewLinks } from "../../../functions/calculate-new-links.js";
import { currentPlayer } from "../dependent-state/current-player.js";
import { validHoverIndex } from "../dependent-state/valid-hover-index.js";

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
