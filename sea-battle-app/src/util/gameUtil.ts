import {Board, BoardCell} from "@shared/gameTypes.ts";

function emptyCell(): BoardCell {
    return {ship: false, hit: false};
}

export function emptyBoard() {
    const board: Board = [];
    for (let i = 0; i < 10; i++) {
        const row: BoardCell[] = [];
        for (let j = 0; j < 10; j++) {
            row.push(emptyCell());
        }
        board.push(row);
    }
    return board;
}