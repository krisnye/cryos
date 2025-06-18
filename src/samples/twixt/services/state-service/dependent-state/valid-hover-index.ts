import { TwixtReadonlyStore } from "../create-state-service2";
import { isHoverValidMove } from "./is-hover-valid-move";

export const validHoverIndex = (store: TwixtReadonlyStore) => isHoverValidMove(store) ? store.resources.hoverIndex : null;
