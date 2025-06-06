import { Observe, withDeduplicate, withMap } from "data/observe";
import { MainService } from "../services/main-service/main-service";
import { BoardPoint } from "../services/state-service/create-state-service";

export const boardPointValue = (
    service: MainService,
    index: number
): Observe<BoardPoint> => withDeduplicate(withMap(
    service.state.observe.resource.board,
    (board) => board[index]
));
