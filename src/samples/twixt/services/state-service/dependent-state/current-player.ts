import { TwixtReadonlyStore } from "../create-state-service2";

export const currentPlayer = (store: TwixtReadonlyStore) => {
    const redCount = store.resources.board.filter(point => point === "red").length;
    const blackCount = store.resources.board.filter(point => point === "black").length;
    return redCount > blackCount ? "black" : "red";
};
