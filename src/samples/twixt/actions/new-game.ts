import { MainService } from "../services/main-service/main-service";
import { getBoardSize } from "../dependent-state/board-size";

export const newGame = (service: MainService): void => {
    const size = getBoardSize(service.state.resources.board);
    service.state.resources.board = new Array(size * size).fill(null);
    service.state.resources.links = [];
}; 