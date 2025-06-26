import { TwixtReadonlyStore } from "../state-service.js";
import { isHoverValidMove } from "./is-hover-valid-move.js";

export const validHoverIndex = (store: TwixtReadonlyStore) => isHoverValidMove(store) ? store.resources.hoverIndex : null;
