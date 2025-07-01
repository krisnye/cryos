import { Observe, withDeduplicate, withMap } from "@adobe/data/observe";
import { MainService } from "../services/main-service/main-service.js";
import { BoardPoint } from "../services/index.js";

export const boardPointValue = (
    service: MainService,
    index: number
): Observe<BoardPoint> => withDeduplicate(withMap(
    service.state.database.observe.resources.board,
    (board) => board[index]
));
