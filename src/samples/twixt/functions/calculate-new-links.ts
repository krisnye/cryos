import { Line2, subLine } from "../../../math/line2/index.js";
import { intersects } from "../../../math/line2/intersects.js";
import { boardSize } from "../services/state-service/dependent-state/board-size.js";
import { Player, BoardLink, BoardPoint } from "../services/state-service/state-service.js";

// Convert board index to x,y coordinates (0,0 is top-left)
const indexToCoords = (index: number, size: number): [number, number] => {
    const x = index % size;
    const y = Math.floor(index / size);
    return [x, y];
};

// Check if two points are a knight's move apart (1x2 or 2x1)
const isKnightMove = (from: [number, number], to: [number, number]): boolean => {
    const dx = Math.abs(from[0] - to[0]);
    const dy = Math.abs(from[1] - to[1]);
    return (dx === 1 && dy === 2) || (dx === 2 && dy === 1);
};

// Convert board link to Line2
const linkToLine2 = (link: BoardLink, size: number): Line2 => {
    const [from, to] = link;
    const [x1, y1] = indexToCoords(from, size);
    const [x2, y2] = indexToCoords(to, size);
    return subLine({
        a: [x1, y1],
        b: [x2, y2]
    }, 0.01, 0.99); // shorten the line to avoid counting endpoints as intersections
};

export const calculateNewLinks = (
    player: Player,
    newIndex: number,
    board: readonly BoardPoint[],
    links: readonly BoardLink[]
): BoardLink[] => {
    const size = Math.round(Math.sqrt(board.length));

    // If the point is already occupied by the opponent, return no potential links
    const pointValue = board[newIndex];
    if (pointValue !== null && pointValue !== player) {
        return [];
    }

    // Find all points of the same color, including the new point
    const playerPoints = board
        .map((point, index) => ({ point, index }))
        .filter(({ point, index }) => 
            // Only include points that are either:
            // 1. The new point we're considering
            // 2. Points that are the same color as the current player
            index === newIndex || point === player
        )
        .map(({ index }) => index);

    // Get coordinates of the new point
    const newCoords = indexToCoords(newIndex, size);

    // Find all valid knight moves to other points of the same color
    const newLinks: BoardLink[] = [];
    
    for (const otherIndex of playerPoints) {
        if (otherIndex === newIndex) continue;
        
        const otherCoords = indexToCoords(otherIndex, size);
        
        // Check if it's a valid knight move
        if (!isKnightMove(newCoords, otherCoords)) continue;
        
        // Create potential new link
        const potentialLink: BoardLink = [newIndex, otherIndex];
        const potentialLine = linkToLine2(potentialLink, size);
        
        // Check if this line intersects with any existing lines
        const hasIntersection = links.some(existingLink => {
            const existingLine = linkToLine2(existingLink, size);
            return intersects(potentialLine, existingLine);
        });
        
        if (!hasIntersection) {
            newLinks.push(potentialLink);
        }
    }
    
    return newLinks;
}; 