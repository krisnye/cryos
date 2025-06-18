// import { mutableClone } from "data/functions/mutable-clone";
// import { createDatastore } from "ecs";
// import { calculateNewLinks } from "samples/twixt/functions/calculate-new-links";
// import { calculateWinner } from "samples/twixt/functions/calculate-winner";

// export type Player = "red" | "black";
// export type BoardPoint = Player | null;
// export type BoardLink = [number, number]; // [fromIndex, toIndex]

// function createCoreDatabase() {
//     return createDatastore().withResources({
//         board: new Array<BoardPoint>(24 ** 2).fill(null),
//         links: new Array<BoardLink>(0),
//         hoverIndex: null as number | null,
//     } as const)
// }

// export function createStateService() {
//     return createCoreDatabase()
//         .toDatabase()
//         .withComputedResource(
//             "currentPlayer",
//             ["board"],
//             ({board}) => {
//                 const redCount = board.filter(point => point === "red").length;
//                 const blackCount = board.filter(point => point === "black").length;
//                 return redCount > blackCount ? "black" : "red";
//             }
//         )
//         .withComputedResource(
//             "boardSize",
//             ["board"],
//             ({board}) => Math.round(Math.sqrt(board.length))
//         )
//         .withComputedResource(
//             "isHoverValidMove",
//             ["hoverIndex", "board", "currentPlayer", "boardSize"],
//             ({hoverIndex, board, currentPlayer, boardSize}) => {
//                 if (hoverIndex === null) {
//                     return false;
//                 }
//                 const piece = board[hoverIndex];
//                 if (piece !== null) return false;
//                 const x = hoverIndex % boardSize;
//                 const y = Math.floor(hoverIndex / boardSize);
//                 // Left or right edge (not corner): only black
//                 if ((x === 0 || x === boardSize - 1) && y > 0 && y < boardSize - 1) {
//                     return currentPlayer === "black";
//                 }
//                 // Top or bottom edge (not corner): only red
//                 if ((y === 0 || y === boardSize - 1) && x > 0 && x < boardSize - 1) {
//                     return currentPlayer === "red";
//                 }
//                 // All other points (not edge or corner)
//                 if (x > 0 && x < boardSize - 1 && y > 0 && y < boardSize - 1) {
//                     return true;
//                 }
//                 // Corners are not valid
//                 return false;
//             })
//         .withComputedResource(
//             "validHoverIndex",
//             ["isHoverValidMove", "hoverIndex"],
//             ({isHoverValidMove, hoverIndex}) => isHoverValidMove ? hoverIndex : null
//         )
//         .withComputedResource("winner", ["board", "links"], calculateWinner)
//         .withTransactions({
//             clickPoint: (db) => {
//                 const index = db.resources.validHoverIndex;
//                 if (index) {
//                     const player = db.resources.currentPlayer;
//                     const board = mutableClone(db.resources.board);
//                     if (board[index] === null) {
//                         board[index] = player;
//                         db.resources.board = board;
//                         const links = db.resources.links;
//                         const newLinks = calculateNewLinks(player, index, board, links);
//                         db.resources.links = [...links, ...newLinks];    
//                     }
//                 }
//             },
//             newGame: (db) => {
//                 const size = db.resources.boardSize;
//                 db.resources.board = new Array<BoardPoint>(size ** 2).fill(null);
//                 db.resources.links = [];
//             },
//             setHoverIndex: (db, index: number | null) => db.resources.hoverIndex = index
//         })
// }
