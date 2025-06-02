
import { fromProperties, Observe, withMap } from "data/observe";
import { MainService } from "../services/main-service/main-service";
import { calculateWinner } from "../functions/calculate-winner";
import { Player } from "../services/state-service/create-state-service";

export const winner = (
    service: MainService
): Observe<Player | null> => withMap(fromProperties({
    board: service.state.observe.resource.board,
    links: service.state.observe.resource.links,
}),
    ({ board, links }) => {
        return calculateWinner({board, links});
    }
);

