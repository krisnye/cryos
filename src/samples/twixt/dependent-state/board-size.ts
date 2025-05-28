import { withMap } from "data/observe";
import { MainService } from "../services/main-service/main-service";
import { BoardPoint } from "../services/state-service/create-state-service";

export const getBoardSize = (board: BoardPoint[]) => {
    return Math.round(Math.sqrt(board.length));
};

export const boardSize = (service: MainService) => withMap(service.state.observe.resource.board, getBoardSize);
