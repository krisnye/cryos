import { TwixtReadonlyStore } from "../state-service";
import { boardSize } from "./board-size";
import { currentPlayer } from "./current-player";

export const isHoverValidMove = (store: TwixtReadonlyStore) => {
    if (store.resources.hoverIndex === null) {
        return false;
    }
    const piece = store.resources.board[store.resources.hoverIndex];
    if (piece !== null) return false;
    
    const size = boardSize(store);
    const x = store.resources.hoverIndex % size;
    const y = Math.floor(store.resources.hoverIndex / size);
    
    // Left or right edge (not corner): only black
    if ((x === 0 || x === size - 1) && y > 0 && y < size - 1) {
        return currentPlayer(store) === "black";
    }
    // Top or bottom edge (not corner): only red
    if ((y === 0 || y === size - 1) && x > 0 && x < size - 1) {
        return currentPlayer(store) === "red";
    }
    // All other points (not edge or corner)
    if (x > 0 && x < size - 1 && y > 0 && y < size - 1) {
        return true;
    }
    // Corners are not valid
    return false;
};