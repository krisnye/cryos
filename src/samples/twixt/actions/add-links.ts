import { MainService } from "../services/main-service/main-service";
import { Player, BoardLink } from "../services/state-service/create-state-service";
import { Line2, subLine } from "math/line2";
import { intersects } from "math/line2/intersects";
import { toPromise } from "data/observe";
import { boardSize } from "../dependent-state/board-size";

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

export const addLinks = async (
    service: MainService, player: Player, newIndex: number,
    dependencies = {
        boardSize: boardSize(service),
        board: service.state.resources.board,
        links: service.state.resources.links,
    }
): Promise<BoardLink[]> => {
    const size = await toPromise(dependencies.boardSize);
    const { board, links } = dependencies;

    // Find all points of the same color
    const playerPoints = board
        .map((point, index) => ({ point, index }))
        .filter(({ point }) => point === player)
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
    
    // Add all valid new links
    if (newLinks.length > 0) {
        console.log(newLinks);
    }
    return newLinks;
}; 