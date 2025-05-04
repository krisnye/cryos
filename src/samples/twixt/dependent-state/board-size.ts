import { withMap } from "data/observe";
import { MainService } from "../services/main-service/main-service";

export const boardSize = (
    service: MainService
) => withMap(
    service.state.observe.board,
    (board) => Math.round(Math.sqrt(board.length))
);