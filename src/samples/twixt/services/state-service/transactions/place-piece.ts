import { mutableClone } from "data/functions/mutable-clone";
import { createStateService, CoreDatabase, Player } from "../create-state-service";
import { calculateNewLinks } from "samples/twixt/functions/calculate-new-links";

export function placePiece(db: CoreDatabase, args: {
    index: number,
    player: Player
}) {
    const board = mutableClone(db.resources.board);
    board[args.index] = args.player;

    db.resources.board = board;
    const links = db.resources.links;
    // const newLinks = calculateNewLinks(service, player, index);
    // db.resources.links = [...links, ...newLinks];

}