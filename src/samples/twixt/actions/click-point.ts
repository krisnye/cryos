import { mutableClone } from "data/functions/mutable-clone";
import { MainService } from "../services/main-service/main-service";
import { toPromise } from "data/observe";
import { currentPlayer } from "../dependent-state/current-player";
import { Player } from "../services/state-service/create-state-service";
import { boardSize } from "../dependent-state/board-size";


async function addLinks(service: MainService, player: Player) {
    const size = await toPromise(boardSize(service))
    const board = service.state.resources.board;
    const links = service.state.resources.links;
}

export const clickPoint = async (
    service: MainService,
    index: number
) => {
    const player = await toPromise(currentPlayer(service));
    const board = mutableClone(service.state.resources.board);
    if (board[index] === null) {
        board[index] = player;
        service.state.resources.board = board;
    }
};
