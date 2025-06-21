import { fromProperties, Observe, withDeduplicate, withMap } from "@adobe/data/observe";
import { MainService } from "../services/main-service/main-service.js";
import { Player } from "../services/index.js";

export const boardPointHover = (
    service: MainService,
    index: number
): Observe<Player | null> => withDeduplicate(withMap(
    fromProperties({
        hoverIndex: service.state.database.observe.resource.hoverIndex,
        player: service.state.observe.currentPlayer,
    }),
    (props) => props.hoverIndex === index ? props.player : null
));