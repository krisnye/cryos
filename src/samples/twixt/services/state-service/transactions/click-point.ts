import { mutableClone } from "@adobe/data";
import { TwixtTransaction } from "../state-service.js";
import { calculateNewLinks } from "../../../functions/calculate-new-links.js";
import { currentPlayer } from "../dependent-state/current-player.js";
import { validHoverIndex } from "../dependent-state/valid-hover-index.js";

export const clickPoint = (t: TwixtTransaction) => {
    const index = validHoverIndex(t);
    if (index) {
        const player = currentPlayer(t);
        const board = mutableClone(t.resources.board);
        if (board[index] === null) {
            board[index] = player;
            t.resources.board = board;
            const links = t.resources.links;
            const newLinks = calculateNewLinks(player, index, board, links);
            t.resources.links = [...links, ...newLinks];    
        }
    }
};
