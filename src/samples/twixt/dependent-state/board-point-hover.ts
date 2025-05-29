import { fromProperties, Observe, withDeduplicate, withMap } from "data/observe";
import { MainService } from "../services/main-service/main-service";
import { Player } from "../services/state-service/create-state-service";
import { currentPlayer } from "./current-player";

export const boardPointHover = (
    service: MainService,
    index: number
): Observe<Player | null> => withDeduplicate(withMap(
    fromProperties({
        hoverIndex: service.state.observe.resource.hoverIndex,
        player: currentPlayer(service),
    }),
    (props) => props.hoverIndex === index ? props.player : null
));