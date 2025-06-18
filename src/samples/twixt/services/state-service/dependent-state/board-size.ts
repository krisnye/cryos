import { TwixtReadonlyStore } from "../create-state-service2";

export const boardSize = (store: TwixtReadonlyStore) => Math.round(Math.sqrt(store.resources.board.length));
