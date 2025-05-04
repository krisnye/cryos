import { mutableClone } from "data/functions/mutable-clone";
import { MainService } from "../services/main-service/main-service";
import { toPromise } from "data/observe";
import { currentPlayer } from "../dependent-state/current-player";

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
