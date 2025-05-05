import { getBoardSize } from "../dependent-state/board-size";
import { MainService } from "../services/main-service/main-service";
import { BoardLink, BoardPoint, Player } from "../services/state-service/create-state-service";

/**
 * The game is won when any player connects a complete unbroken line of their own color from one edge to the opposite edge.
 */
export const calculateWinner = (
    board: BoardPoint[],
    links: BoardLink[],
): Player | null => {
    const size = getBoardSize(board);
    
    // Check if any player has a complete line from one edge to the opposite edge
    const players = ["red", "black"] as const;
    for (const player of players) {
        // Get all points of this player's color
        const playerPoints = board
            .map((point, index) => ({ point, index }))
            .filter(({ point }) => point === player)
            .map(({ index }) => index);

        // For red player, check top to bottom
        if (player === "red") {
            const topPoints = playerPoints.filter(index => Math.floor(index / size) === 0);
            const bottomPoints = playerPoints.filter(index => Math.floor(index / size) === size - 1);
            
            // Check if there's a path from any top point to any bottom point
            for (const start of topPoints) {
                if (hasPathToAny(start, bottomPoints, playerPoints, links)) {
                    return player;
                }
            }
        }
        
        // For black player, check left to right
        if (player === "black") {
            const leftPoints = playerPoints.filter(index => index % size === 0);
            const rightPoints = playerPoints.filter(index => index % size === size - 1);
            
            // Check if there's a path from any left point to any right point
            for (const start of leftPoints) {
                if (hasPathToAny(start, rightPoints, playerPoints, links)) {
                    return player;
                }
            }
        }
    }

    return null;
};

// Helper function to check if there's a path from start to any of the target points
const hasPathToAny = (
    start: number,
    targets: number[],
    playerPoints: number[],
    links: [number, number][]
): boolean => {
    const visited = new Set<number>();
    const queue = [start];
    
    while (queue.length > 0) {
        const current = queue.shift()!;
        
        if (targets.includes(current)) {
            return true;
        }
        
        if (visited.has(current)) {
            continue;
        }
        
        visited.add(current);
        
        // Find all connected points through links
        const connectedPoints = links
            .filter(link => link[0] === current || link[1] === current)
            .map(link => link[0] === current ? link[1] : link[0])
            .filter(point => playerPoints.includes(point));
        
        queue.push(...connectedPoints);
    }
    
    return false;
};