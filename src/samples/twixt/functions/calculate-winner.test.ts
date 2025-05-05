import { describe, it, expect } from 'vitest';
import { calculateWinner } from './calculate-winner';
import type { Player } from '../services/state-service/create-state-service';

describe('calculateWinner', () => {
    // Helper function to create a board with specific points
    const createBoard = (size: number, points: { index: number; player: Player }[]) => {
        const board = new Array(size * size).fill(null);
        points.forEach(({ index, player }) => {
            board[index] = player;
        });
        return board;
    };

    it('should return null for empty board', () => {
        const board = new Array(5 * 5).fill(null);
        const links: [number, number][] = [];
        
        const result = calculateWinner(board, links);
        expect(result).toBe(null);
    });

    it('should detect red player win from top to bottom', () => {
        // Create a 5x5 board with red pieces forming a path from top to bottom
        const board = createBoard(5, [
            { index: 0, player: 'red' },  // top-left
            { index: 7, player: 'red' },  // middle-left
            { index: 14, player: 'red' }, // middle
            { index: 21, player: 'red' }, // middle-right
            { index: 24, player: 'red' }, // bottom-right
        ]);

        // Create links between the pieces
        const links: [number, number][] = [
            [0, 7],   // top-left to middle-left
            [7, 14],  // middle-left to middle
            [14, 21], // middle to middle-right
            [21, 24], // middle-right to bottom-right
        ];

        const result = calculateWinner(board, links);
        expect(result).toBe('red');
    });

    it('should detect black player win from left to right', () => {
        // Create a 5x5 board with black pieces forming a path from left to right
        const board = createBoard(5, [
            { index: 0, player: 'black' },  // top-left
            { index: 2, player: 'black' },  // top-middle
            { index: 4, player: 'black' },  // top-right
            { index: 10, player: 'black' }, // middle-left
            { index: 14, player: 'black' }, // middle
            { index: 18, player: 'black' }, // middle-right
            { index: 20, player: 'black' }, // bottom-left
            { index: 22, player: 'black' }, // bottom-middle
            { index: 24, player: 'black' }, // bottom-right
        ]);

        // Create links between the pieces
        const links: [number, number][] = [
            [0, 2],   // top-left to top-middle
            [2, 4],   // top-middle to top-right
            [0, 10],  // top-left to middle-left
            [10, 14], // middle-left to middle
            [14, 18], // middle to middle-right
            [18, 24], // middle-right to bottom-right
            [20, 22], // bottom-left to bottom-middle
            [22, 24], // bottom-middle to bottom-right
        ];

        const result = calculateWinner(board, links);
        expect(result).toBe('black');
    });

    it('should return null when no player has won', () => {
        // Create a 5x5 board with some pieces but no winning path
        const board = createBoard(5, [
            { index: 0, player: 'red' },
            { index: 7, player: 'red' },
            { index: 14, player: 'red' },
            { index: 1, player: 'black' },
            { index: 8, player: 'black' },
            { index: 15, player: 'black' },
        ]);

        // Create some links but not enough for a win
        const links: [number, number][] = [
            [0, 7],  // red pieces
            [7, 14],
            [1, 8],  // black pieces
            [8, 15],
        ];

        const result = calculateWinner(board, links);
        expect(result).toBe(null);
    });

    it('should handle disconnected pieces', () => {
        // Create a 5x5 board with pieces that could form a path but aren't linked
        const board = createBoard(5, [
            { index: 0, player: 'red' },  // top-left
            { index: 7, player: 'red' },  // middle-left
            { index: 14, player: 'red' }, // middle
            { index: 21, player: 'red' }, // middle-right
            { index: 24, player: 'red' }, // bottom-right
        ]);

        // No links between pieces
        const links: [number, number][] = [];

        const result = calculateWinner(board, links);
        expect(result).toBe(null);
    });

    it('should handle multiple possible paths', () => {
        // Create a 5x5 board with multiple possible winning paths
        const board = createBoard(5, [
            { index: 0, player: 'red' },   // top-left
            { index: 2, player: 'red' },   // top-middle
            { index: 4, player: 'red' },   // top-right
            { index: 10, player: 'red' },  // middle-left
            { index: 12, player: 'red' },  // middle
            { index: 14, player: 'red' },  // middle-right
            { index: 20, player: 'red' },  // bottom-left
            { index: 22, player: 'red' },  // bottom-middle
            { index: 24, player: 'red' },  // bottom-right
        ]);

        // Create links forming multiple possible paths
        const links: [number, number][] = [
            [0, 2],   // top path
            [2, 4],
            [0, 10],  // left path
            [10, 12],
            [12, 14],
            [14, 24], // right path
            [20, 22], // bottom path
            [22, 24],
        ];

        const result = calculateWinner(board, links);
        expect(result).toBe('red');
    });
}); 