import { TwixtReadonlyStore } from "../state-service.js";

export const boardSize = (store: TwixtReadonlyStore) => Math.round(Math.sqrt(store.resources.board.length));
