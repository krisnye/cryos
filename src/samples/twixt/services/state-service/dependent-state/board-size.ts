import { TwixtReadonlyStore } from "../state-service";

export const boardSize = (store: TwixtReadonlyStore) => Math.round(Math.sqrt(store.resources.board.length));
