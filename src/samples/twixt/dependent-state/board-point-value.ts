import { Observe, withDeduplicate, withMap } from "data/observe";
import { MainService } from "../services/main-service/main-service";
import { BoardPoint } from "../services";

export const boardPointValue = (
    service: MainService,
    index: number
): Observe<BoardPoint> => withDeduplicate(withMap(
    service.state.database.observe.resource.board,
    (board) => board[index]
));
