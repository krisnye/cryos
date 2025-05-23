import { mutableClone } from "data/functions/mutable-clone";
import { MainService } from "../services/main-service/main-service";
import { toPromise } from "data/observe";
import { currentPlayer } from "../dependent-state/current-player";
import { calculateNewLinks } from "../functions/calculate-new-links";

export const clickPoint = async (
    service: MainService,
    index: number
) => {
    const player = await toPromise(currentPlayer(service));
    const board = mutableClone(service.state.resources.board);
    
    // Only place a piece if the point is empty
    if (board[index] === null) {
        board[index] = player;
        service.state.resources.board = board;
        const links = service.state.resources.links;
        const newLinks = calculateNewLinks(service, player, index);
        service.state.resources.links = [...links, ...newLinks];
    }
};
