import { Observe, withMap } from "data/observe";
import { Player } from "../services/state-service/create-state-service";
import { MainService } from "../services/main-service/main-service";

export const currentPlayer = (
    service: MainService
): Observe<Player> => withMap(service.state.observe.board,
    (board) => {
        const redCount = board.filter(point => point === "red").length;
        const blackCount = board.filter(point => point === "black").length;
        return redCount > blackCount ? "black" : "red";
    }
);

