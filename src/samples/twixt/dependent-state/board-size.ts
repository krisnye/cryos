import { fromProperties, withMap } from "data/observe";
import { MainService } from "../services/main-service/main-service";

export const boardSize = (
    service: MainService
) => withMap(
    fromProperties({ board: service.state.observe.board }),
    (props) => Math.round(Math.sqrt(props.board.length))
);